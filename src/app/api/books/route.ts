import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";

const createBookSchema = z.object({
    url: z.string().url(),
    fileName: z.string().min(1).max(512),
    title: z.string().trim().max(512).optional(),
    size: z.number().int().nonnegative(),
});

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
        const data = createBookSchema.parse(await req.json());
        const title = data.title?.trim() || data.fileName.replace(/\.pdf$/i, "");
        let fileKey = data.url;
        try {
            fileKey = new URL(data.url).pathname.replace(/^\//, "");
        } catch {
            // keep url as key fallback
        }
        const book = await prisma.book.create({
            data: {
                userId: user.id,
                title,
                fileName: data.fileName,
                fileUrl: data.url,
                fileKey,
                mimeType: "application/pdf",
                size: data.size,
            },
        });
        return NextResponse.json({ book }, { status: 201 });
    } catch (err) {
        return handleZod(err);
    }
}
