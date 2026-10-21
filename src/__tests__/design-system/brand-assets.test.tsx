import React from "react";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { render, screen, cleanup } from "@testing-library/react";
import { BrandMark } from "@/components/brand/BrandMark";
import { BRAND_SVGS, BRAND_ASSET_SHA256 } from "@/lib/brand-assets";
import authority from "@/styles/brand-authority.json";
import { BRAND_COLORS } from "@/lib/brand-tokens";
const root = path.resolve(__dirname, "../..");
afterEach(cleanup);

describe("approved Evidence Shield sources", () => {
  it.each(Object.entries(BRAND_ASSET_SHA256))("preserves the approved bytes for %s", (filename, checksum) => {
    const content = fs.readFileSync(path.join(root, "../public/brand", filename), "utf8");
    expect(createHash("sha256").update(content).digest("hex")).toBe(checksum);
    const key = filename.replace("truthbounty-", "").replace(".svg", "") as keyof typeof BRAND_SVGS;
    expect(BRAND_SVGS[key]).toBe(content);
    expect(content).not.toMatch(/<script|<foreignObject|\son\w+\s*=|(?:href|src)=["'](?:https?:|javascript:|data:)/i);
  });
  it("has one accessible name per mark and hides decorative duplicates", () => {
    render(<><BrandMark /><BrandMark variant="glyph" /><BrandMark decorative /></>);
    expect(screen.getAllByRole("img", { name: "TruthBounty" })).toHaveLength(2);
  });
  it("scopes inline SVG identifiers and gradient references without changing geometry", () => {
    const { container } = render(<><BrandMark /><BrandMark /><BrandMark variant="glyph" /></>);
    const ids = [...container.querySelectorAll("[id]")].map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const element of container.querySelectorAll("[fill]")) {
      const reference = element.getAttribute("fill")?.match(/^url\(#(.+)\)$/)?.[1];
      if (reference) expect(container.querySelector(`[id="${reference}"]`)).not.toBeNull();
    }
    const approved = new DOMParser().parseFromString(BRAND_SVGS["glyph"], "image/svg+xml");
    const actual = container.querySelectorAll("svg")[4];
    expect([...actual.querySelectorAll("path")].map(node => node.getAttribute("d")))
      .toEqual([...approved.querySelectorAll("path")].map(node => node.getAttribute("d")));
  });
});

describe("approved foundation values", () => {
  it("keeps typed production colours aligned with the verbatim CSS source", () => {
    const css = fs.readFileSync(path.join(root, "styles/brand-authority.css"), "utf8").toLowerCase();
    for (const [name, value] of Object.entries(BRAND_COLORS)) expect(css).toContain(`--tb-${name}: ${value.toLowerCase()};`);
  });
  it("preserves exact brand, semantic, dimension and motion values from authority", () => {
    expect(authority.color.brand.signalCyan.$value).toBe("#22D3EE");
    expect(authority.color.brand.proofBlue.$value).toBe("#4F7CFF");
    expect(authority.color.brand.bountyGold.$value).toBe("#F5B942");
    expect(authority.color.semantic.success.$value).toBe("#41D39A");
    expect(authority.color.semantic.attention.$value).toBe("#F4B860");
    expect(authority.color.semantic.danger.$value).toBe("#FF6B7A");
    expect(authority.dimension.touchMin.$value).toBe("44px");
    expect(Object.values(authority.duration).map(token => token.$value)).toEqual(["120ms", "180ms", "240ms"]);
  });
  it("keeps the canonical CSS and JSON byte-identical to the pinned authority", () => {
    const expected = {
      "brand-authority.css": "179602093db094a0fe232f23b9139f3b714392fa9899481fda48036ac5091459",
      "brand-authority.json": "bd1f9ceb1fda442450bcee06e875cbc39725823290d643399936213bf198aec9",
    };
    for (const [filename, checksum] of Object.entries(expected)) {
      expect(createHash("sha256").update(fs.readFileSync(path.join(root, "styles", filename))).digest("hex")).toBe(checksum);
    }
  });
});
