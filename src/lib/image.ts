// Downscales an uploaded logo client-side before it ever reaches the network. Brand logos are
// displayed as a tiny globe marker (and a small preview), so shipping a full multi-megabyte source
// image is pure waste — it slows the upload, bloats Supabase storage, and becomes an oversized
// texture for every future visitor's globe. Any failure here silently falls back to the original
// file so the claim/checkout flow never breaks because of this optimization.
export async function resizeImageFile(file: File, maxDimension = 512, quality = 0.86): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) { bitmap.close?.(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const type = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type });
  } catch {
    return file;
  }
}
