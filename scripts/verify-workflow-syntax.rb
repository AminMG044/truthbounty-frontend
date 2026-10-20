require "psych"

workflow_paths = Dir.glob(".github/workflows/*.{yml,yaml}").sort
abort "No workflow YAML files found" if workflow_paths.empty?

def reject_duplicate_keys(node, path)
  case node
  when Psych::Nodes::Mapping
    seen = {}
    node.children.each_slice(2) do |key, value|
      key_name = key.is_a?(Psych::Nodes::Scalar) ? key.value : key.class.name
      abort "#{path}: duplicate YAML key #{key_name.inspect}" if seen[key_name]

      seen[key_name] = true
      reject_duplicate_keys(key, path)
      reject_duplicate_keys(value, path)
    end
  when Psych::Nodes::Sequence
    node.children.each { |child| reject_duplicate_keys(child, path) }
  end
end

workflow_paths.each do |workflow_path|
  document = Psych.parse_file(workflow_path)
  abort "#{workflow_path}: empty YAML document" unless document

  reject_duplicate_keys(document, workflow_path)
  puts "Validated #{workflow_path}"
end