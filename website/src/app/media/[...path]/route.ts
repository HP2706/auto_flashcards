import fs from "node:fs";
import path from "node:path";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".md":
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export function GET(_req: Request, ctx: { params: { path: string[] } }) {
  // Allow reading from repo root under 'files/' or 'markdown_cards/'
  const segs = ctx.params.path || [];
  const rel = segs.join("/");
  const baseRoot = path.resolve(process.cwd(), "..");
  const allowedRoots = [
    path.join(baseRoot, "files"),
    path.join(baseRoot, "markdown_cards"),
    path.join(baseRoot, "website", "public"),
    path.join(baseRoot, "website", "markdown_cards"),
    path.join(baseRoot, "website", "files"),
  ];

  const candidates = [
    path.resolve(baseRoot, rel),
    path.resolve(baseRoot, "website", "public", rel),
  ];
  const target = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!target) return new Response("Not found", { status: 404 });
  const withinAllowed = allowedRoots.some((root) => target.startsWith(root + path.sep));
  if (!withinAllowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const buf = fs.readFileSync(target);
  return new Response(buf, { headers: { "Content-Type": contentTypeFor(target) } });
}
