import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
export async function POST(request: Request) {
  try {
    const file = (await request.formData()).get("logo");
    if (!(file instanceof File)) return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    if (!allowed.has(file.type) || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Use a PNG, JPG or WebP under 2MB" }, { status: 400 });
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `pending/${crypto.randomUUID()}.${ext}`; const supabase = getAdminClient();
    const { error } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type, upsert: false }); if (error) throw error;
    return NextResponse.json({ url: supabase.storage.from("logos").getPublicUrl(path).data.publicUrl });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 }); }
}
