import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadPdf } from "@/lib/storage";
import { handleZod, jsonError } from "@/lib/api";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function GET() {
  try {
    const user = await requireUser();
    const books = await prisma.book.findMany({
      where: { userId: user.id },
      orderBy: [{ lastOpenedAt: { sort: "desc", nulls: "last" } }, { uploadedAt: "desc" }],
    });
    return NextResponse.json({ books });
  } catch (err) {
    return handleZod(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    const titleInput = (form.get("title") as string | null)?.trim();
    if (!(file instanceof File)) return jsonError("No file uploaded", 400);
    if (file.type !== "application/pdf") return jsonError("Only PDF files are supported", 400);
    if (file.size > MAX_SIZE) return jsonError("File too large (max 50 MB)", 400);

    const buf = await file.arrayBuffer();
    const uploaded = await uploadPdf(file.name, new Blob([buf], { type: file.type }), file.type);

    const title = titleInput || file.name.replace(/\.pdf$/i, "");
    const book = await prisma.book.create({
      data: {
        userId: user.id,
        title,
        fileName: file.name,
        fileUrl: uploaded.url,
        fileKey: uploaded.key,
        mimeType: file.type,
        size: file.size,
      },
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    return handleZod(err);
  }
}
