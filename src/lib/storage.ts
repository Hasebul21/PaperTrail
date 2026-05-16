import { put, del } from "@vercel/blob";

export type UploadedFile = {
  url: string;
  key: string;
  size: number;
  contentType: string;
};

export async function uploadPdf(
  filename: string,
  body: Blob | ArrayBuffer | Uint8Array,
  contentType = "application/pdf"
): Promise<UploadedFile> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Set it in your environment to enable PDF uploads."
    );
  }
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const key = `books/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const blob = await put(key, body as Blob, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return {
    url: blob.url,
    key,
    size: blob.url ? (body instanceof Blob ? body.size : (body as ArrayBuffer).byteLength) : 0,
    contentType,
  };
}

export async function deletePdf(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // best-effort
  }
}
