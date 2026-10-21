/**
 * Centralized, versioned sanitizer for untrusted rich-text and
 * evidence-content rendering.
 *
 * Scope (approved Markdown/HTML subset):
 *  - Blocks: headings (h1-h6), paragraphs, blockquotes, ordered/unordered lists,
 *    code blocks, inline code, horizontal rules, link-only anchors.
 *  - Inline: strong, em, code, br, anchors with sanitized href/rel.
 *  - Never allowed: script, style, iframe, object, embed, form, input,
 *    event handlers, data* attributes, javascript:/ URLs, bidi controls.
 *
 * This module is the single source of truth for content sanitization.
 * Any change to the allowed subset must bump SANITIZER_VERSION.
 */

export const SANITIZER_VERSION = '1.0.0' as const;

/** Maximum accepted input length (bytes) before truncation. */
export const MAX_CONTENT_LENGTH = 200_000;

/** Maximum depth of nested lists/quotes before we fail closed. */
export const MAX_NESTING_DEPTH = 12;

/** Allowed external link protocols (approved security policy). */
const ALLOWED_LINK_PROTOCOLS = ['https:', 'https://'] as const;
const ALLOWED_LINK_SCHEMES = new Set(['mailto:', 'tel:']);

/** Bidi control codepoints that must be stripped. */
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/g;

/** Unicode confusables that are normalized to ASCII equivalents. */
const CONFUSABLE_MAP: Record<string, string> = {
  // Common Cyrillic/Greek homoglyphs used in phishing.
  '\u043A': 'a',
  '\u0435': 'e',
  '\u043e': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0445': 'x',
  '\u043E': 'O',
  '\u0415': 'E',
  '\u0410': 'A',
  '\u0412': 'B',
  '\u0391': 'A',
  '\u0395': 'E',
  '\u0397': 'H',
  '\u0399': 'I',
  '\u039a': 'K',
  '\u039c': 'M',
  '\u039d': 'N',
  '\u039F': 'O',
  '\u03A1': 'P',
  '\u03A4': 'T',
  '\u03A7': 'X',
  '\u03B2': 'B',
  '\u03B1': 'a',
  '\u03B5': 'e',
  '\u03B7': 'h',
  '\u03B9': 'i',
  '\u03BA': 'k',
  '\u03BC': 'm',
  '\u03BD': 'n',
  '\u03BF': 'o',
  '\u03C1': 'p',
  '\u03C4': 't',
  '\u03C7': 'x',
  '\u03C8': 'y',
  '\u2010': '-',
  '\u2011': '-',
  '\u2012': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2026': '...',
  '\u00A0': ' ',
  '\u200B': '',
};

const CONFUSABLE_RE = new RegExp(
  `[${Object.keys(CONFUSABLE_MAP).join('')}]`.replace(/[\^]/g, '\\$&'),
  'g',
);

/** Explicit safe boundary marker for unsupported content. */
export const UNSUPPORTED_BOUNDARY_LABEL = 'Unsupported content';

export interface SanitizeResult {
  /** Sanitized HTML string safe for dangerouslySetInnerHTML. */
  html: string;
  /** Whether the input was truncated due to size limits. */
  truncated: boolean;
  /** Whether any unsupported content was replaced by a safe boundary. */
  hasUnsupported: boolean;
  /** Sanitizer version that produced this result. */
  version: typeof SANITIZER_VERSION;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeConfusables(value: string): string {
  return value.replace(CONFUSABLE_RE, (char) => CONFUSABLE_MAP[char] ?? char);
}

/** Strip bidi controls and normalize Unicode confusables. */
export function normalizeUntrustedText(value: string): string {
  return normalizeConfusables(value.replace(BIDI_CONTROLS, ''));
}

function truncate(value: string, max: number): { value: string; truncated: boolean } {
  if (value.length <= max) return { value, truncated: false };
  return { value: value.slice(0, max), truncated: true };
}

/**
 * Sanitize a short plain-text string (titles, labels, summaries).
 * Returns an escaped string with bidi controls stripped and confusables normalized.
 */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  const normalized = normalizeUntrustedText(value);
  const { value: bounded } = truncate(normalized, maxLength);
  return escapeHtml(bounded);
}

/**
 * Validate and normalize a link href according to the approved security policy.
 * Returns null when the URL is unsafe or disallowed.
 */
export function sanitizeLinkHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const trimmed = normalizeUntrustedText(href).trim();
  if (!trimmed) return null;

  // Block javascript:, data:, vbscript:, file:, blob: and any other non-allowed scheme.
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  // Relative URLs are allowed only when they do not attempt protocol relative escape.
  if (/^\/[^/]/.test(trimmed) || /^\/$/.test(trimmed)) {
    return trimmed;
  }

  // Anchor links within the same document.
  if (/^#[A-Za-z0-9_\-.:]+$/.test(trimmed)) {
    return trimmed;
  }

  // Allowed non-http schemes.
  for (const scheme of ALLOWED_LINK_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return trimmed;
    }
  }

  // External http(s) links.
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    try {
      // eslint-disable-next-line no-new-func
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  return null;
}

/** Returns true when the URL is an external link requiring rel="noopener noreferrer". */
export function isExternalLink(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Render a safe boundary for unsupported content. */
export function renderUnsupportedBoundary(reason?: string): string {
  const detail = reason ? `: ${escapeHtml(reason)}` : '';
  return `<div class="rt-unsupported-boundary" role="note" aria-label="${UNSUPPORTED_BOUNDARY_LABEL}"><strong>${UNSUPPORTED_BOUNDARY_LABEL}</strong>${detail}</div>`;
}

// -----------------------------------------------------------------------------
// Markdown subset renderer
// -----------------------------------------------------------------------------

interface RenderContext {
  hasUnsupported: boolean;
}

function renderInline(text: string, ctx: RenderContext): string {
  let out = escapeHtml(text);

  // Inline code first so its content is not re-interpreted.
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);

  // Links: [label](href)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = sanitizeLinkHref(href);
    if (!safeHref) {
      ctx.hasUnsupported = true;
      return `${label} <span class="rt-unsupported-boundary" role="note">${UNSUPPORTED_BOUNDARY_LABEL}</span>`;
    }
    const external = isExternalLink(safeHref);
    const rel = external ? ' rel="noopener noreferrer"' : '';
    const target = external ? ' target="_blank"' : '';
    const labelText = external ? `${label} <span aria-hidden="true">(opens in new tab)</span>` : label;
    return `<a href="${escapeHtml(safeHref)}"${target}${rel}>${labelText}</a>`;
  });

  // Bold and italic.
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');

  return out;
}

function renderLines(lines: string[], ctx: RenderContext): string {
  const output: string[] = [];
  let i = 0;
  let listDepth = 0;

  const closeLists = () => {
    while (listDepth > 0) {
      output.push('</ul>');
      listDepth -= 1;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fonced code block.
    if (/^```/.test(line)) {
      closeLists();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // skip closing fence
      output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Headings.
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${renderInline(headingMatch[2], ctx)}</h${level}>`);
      i += 1;
      continue;
    }

    // Horizontal rule.
    if (/^(?:---|\*\*\*|___)$/.test(line.trim())) {
      closeLists();
      output.push('<hr />');
      i += 1;
      continue;
    }

    // Blockquote.
    if (/^>\s?/.test(line)) {
      closeLists();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      output.push(`<blockquote>${renderLines(quoteLines, ctx)}</blockquote>`);
      continue;
    }

    // Unordered list.
    const ulMatch = /^(\s*)[-*] +(.+)$/.exec(line);
    if (ulMatch) {
      const indent = Math.floor(ulMatch[1].length / 2) + 1;
      if (indent > MAX_NESTING_DEPTH) {
        ctx.hasUnsupported = true;
        output.push(renderUnsupportedBoundary('excessive nesting'));
        i += 1;
        continue;
      }
      while (listDepth < indent) {
        output.push('<ul>');
        listDepth += 1;
      }
      while (listDepth > indent) {
        output.push('</ul>');
        listDepth -= 1;
      }
      output.push(`<li>${renderInline(ulMatch[2], ctx)}</li>`);
      i += 1;
      continue;
    }

    // Ordered list.
    const olMatch = /^(\s*)\d+\. +(.+)$/.exec(line);
    if (olMatch) {
      const indent = Math.floor(olMatch[1].length / 2) + 1;
      if (indent > MAX_NESTING_DEPTH) {
        ctx.hasUnsupported = true;
        output.push(renderUnsupportedBoundary('excessive nesting'));
        i += 1;
        continue;
      }
      while (listDepth < indent) {
        output.push('<ol>');
        listDepth += 1;
      }
      while (listDepth > indent) {
        output.push('</ol>');
        listDepth -= 1;
      }
      output.push(`<li>${renderInline(olMatch[2], ctx)}</li>`);
      i += 1;
      continue;
    }

    // Blank line closes lists and separates paragraphs.
    if (line.trim() === '') {
      closeLists();
      i += 1;
      continue;
    }

    // Paragraph.
    closeLists();
    const paragraphLines: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s:)[-*] +/.test(lines[i]) &&
      !/^(\s*)\d+\. +/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    output.push(`<p>${renderInline(paragraphLines.join(' '), ctx)}</p>`);
  }

  closeLists();
  return output.join('');
}

/**
 * Sanitize and render a Markdown subset into safe HTML.
 * This is the single entry point used by all approved screens.
 */
export function sanitizeRichText(value: unknown): SanitizeResult {
  if (typeof value !== 'string') {
    return {
      html: '',
      truncated: false,
      hasUnsupported: false,
      version: SANITIZER_VERSION,
    };
  }

  const normalized = normalizeUntrustedText(value);
  const { value: bounded, truncated } = truncate(normalized, MAX_CONTENT_LENGTH);
  const ctx: RenderContext = { hasUnsupported: false };
  const html = renderLines(bounded.split(/\r?\n/), ctx);

  return {
    html,
    truncated,
    hasUnsupported: ctx.hasUnsupported,
    version: SANITIZER_VERSION,
  };
}
