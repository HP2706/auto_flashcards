import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return new Response("No file", { status: 400 });
    // file is a Blob (Web API)
    const arrayBuf = await (file as Blob).arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    // detect extension from mime
    const mime = (file as File).type || "application/octet-stream";
    let ext = ".bin";
    if (mime.includes("png")) ext = ".png";
    else if (mime.includes("jpeg")) ext = ".jpg";
    else if (mime.includes("gif")) ext = ".gif";
    else if (mime.includes("svg")) ext = ".svg";
    else if (mime.includes("webp")) ext = ".webp";
    const filesDir = path.join(process.cwd(), "public", "files");
    fs.mkdirSync(filesDir, { recursive: true });
    const name = `${hash}${ext}`;
    const dest = path.join(filesDir, name);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf);
    const isImage = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext);
    return Response.json({ ok: true, path: `files/${name}`, url: `/files/${name}`, isImage });
  } catch (e) {
    return new Response("Upload failed", { status: 500 });
  }
}

