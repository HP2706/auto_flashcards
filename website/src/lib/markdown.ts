import katex from "katex";

const DEBUG_MD = process.env.NEXT_PUBLIC_DEBUG_MD === '1';

export function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  let text = md.replace(/\r\n/g, "\n").trim();
  if (DEBUG_MD) {
    // Limit to avoid noisy logs
    console.log(`[md.start] len=${md.length} preview=${JSON.stringify(md.slice(0, 160))}`);
  }

  const codeBlocks: string[] = [];
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.push(`<pre><code>${esc(code)}</code></pre>`) - 1;
    return `__CODEBLOCK_${idx}__`;
  });

  // Protect inline code BEFORE math so `$` inside code isn't treated as math
  const codeInlines: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeInlines.push(`<code>${esc(code)}</code>`) - 1;
    return `__CODEINLINE_${idx}__`;
  });

  // Protect KaTeX block math for later rendering
  const mathBlocks: string[] = [];
  // $$ ... $$ display math (ignore escaped $$)
  text = text.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_, expr) => {
    const idx = mathBlocks.push(expr) - 1;
    return `__MATHBLOCK_${idx}__`;
  });
  // \\[ ... \\] display math (ignore escaped brackets)
  text = text.replace(/(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]/g, (_, expr) => {
    const idx = mathBlocks.push(expr) - 1;
    return `__MATHBLOCK_${idx}__`;
  });

  // Protect inline math BEFORE other markdown transforms to avoid corruption
  const inlineMath: string[] = [];
  // Allow optional whitespace after opening $, support multi-line content
  text = text.replace(/(^|[^$])(?<!\\)\$([^$]+?)(?<!\\)\$(?!\d)/g, (_, pre: string, expr: string) => {
    const idx = inlineMath.push(expr) - 1;
    return `${pre}__MATHINLINE_${idx}__`;
  });
  // \\( ... \\) inline math (ignore escaped parens)
  text = text.replace(/(?<!\\)\\\(([^]*?)(?<!\\)\\\)/g, (_, expr: string) => {
    const idx = inlineMath.push(expr) - 1;
    return `__MATHINLINE_${idx}__`;
  });

  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt: string, url: string) => {
    let clean = (url || "").trim();
    clean = clean.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "");
    const isHttp = /^https?:\/\//i.test(clean);
    const isData = /^data:/i.test(clean);
    const isFiles = clean.startsWith("files/") || clean.startsWith("/files/");
    const src = isHttp || isData ? clean : isFiles ? (clean.startsWith("/") ? clean : `/${clean}`) : `/media/${encodeURI(clean.replace(/^\//, ""))}`;
    const altEsc = esc(alt || "");
    return `<img src="${src}" alt="${altEsc}" style="max-width:100%;height:auto;"/>`;
  });

  // bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // inline code handled via placeholders above
  // headers
  text = text.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  // lists
  text = text.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  text = text.replace(/(<li>[^<]+<\/li>\n?)+/g, (m) => `<ul>${m.replace(/\n/g, "")}</ul>`);
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, t: string, url: string) => {
    let clean = (url || "").trim();
    clean = clean.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "");
    const isHttp = /^https?:\/\//i.test(clean);
    const isData = /^data:/i.test(clean);
    const isFiles = clean.startsWith("files/") || clean.startsWith("/files/");
    const href = isHttp || isData ? clean : isFiles ? (clean.startsWith("/") ? clean : `/${clean}`) : `/media/${encodeURI(clean.replace(/^\//, ""))}`;
    return `<a href="${href}" target="_blank" rel="noreferrer">${t}</a>`;
  });

  // paragraphs: keep simple to avoid breaking math; rely on explicit tags and <br/>
  text = text.replace(/\n\n+/g, "\n\n").replace(/\n/g, "<br/>\n");

  // Restore block math placeholders with KaTeX display rendering
  text = text.replace(/__MATHBLOCK_(\d+)__/g, (_, i: string) => {
    const idx = Number(i);
    const expr = isNaN(idx) ? "" : (mathBlocks[idx] || "");
    try {
      const html = katex.renderToString(expr, { throwOnError: false, displayMode: true });
      return `<div class="math-block">${html}</div>`;
    } catch {
      return `<pre>$$${esc(expr)}$$</pre>`;
    }
  });

  // Restore inline math placeholders
  text = text.replace(/__MATHINLINE_(\d+)__/g, (_, i: string) => {
    const idx = Number(i);
    const expr = isNaN(idx) ? "" : (inlineMath[idx] || "");
    try {
      return katex.renderToString(expr, { throwOnError: false, displayMode: false });
    } catch {
      return `<code>$${esc(expr)}$</code>`;
    }
  });

  // Unescape escaped dollars that are not part of math (placeholders removed above)
  text = text.replace(/\\\$/g, "$" );

  // Restore code blocks
  text = text.replace(/__CODEBLOCK_(\d+)__/g, (_, i: string) => codeBlocks[Number(i)] || "");
  // Restore inline code
  text = text.replace(/__CODEINLINE_(\d+)__/g, (_, i: string) => codeInlines[Number(i)] || "");

  // Fallback (should be rare): none — block math handled via placeholders

  if (DEBUG_MD) {
    console.log(`[md.done] len=${text.length} preview=${JSON.stringify(text.slice(0, 160))}`);
  }
  return text;
}
