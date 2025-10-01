import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase";

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

    // Upload to Supabase Storage bucket
    const authHeader = req.headers.get("authorization") || undefined;
    const supabase = createServerSupabase(authHeader);
    const path = `uploads/${hash}${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("flashcard-images")
      .upload(path, buf, { contentType: mime, upsert: true });
    if (uploadError) {
      console.error("Upload to storage failed:", uploadError);
      return new Response("Upload failed", { status: 500 });
    }

    const { data: pub } = supabase.storage.from("flashcard-images").getPublicUrl(path);
    const isImage = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext);
    return Response.json({ ok: true, path, url: pub.publicUrl, isImage });
  } catch (e) {
    return new Response("Upload failed", { status: 500 });
  }
}
