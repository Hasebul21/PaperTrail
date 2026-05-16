import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { createHighlightSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string }> };

async function assertBook(bookId: string, userId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, userId: true } });
    if (!book) throw new Error("NOT_FOUND");
    if (book.userId !== userId) throw new Error("FORBIDDEN");
}

export async function GET(_req: NextRequest, ctx: Ctx) {
    try {
        const user = await requireUser();
        const { bookId } = await ctx.params;
        await assertBook(bookId, user.id);
        const highlights = await prisma.highlight.findMany({
            where: { bookId, userId: user.id },
            include: { notes: true },
            orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
        });
        return NextResponse.json({ highlights });
    } catch (err) {
        return handleZod(err);
    }
}

export async function POST(req: NextRequest, ctx: Ctx) {
    try {
        const user = await requireUser();
        const { bookId } = await ctx.params;
        await assertBook(bookId, user.id);
        const body = await req.json();
        const data = createHighlightSchema.parse(body);

        const highlight = await prisma.highlight.create({
            data: {
                userId: user.id,
                bookId,
                pageNumber: data.pageNumber,
                selectedText: data.selectedText,
                color: data.color,
                rects: data.rects ?? undefined,
            },
        });

        if (data.noteContent) {
            await prisma.note.create({
                data: {
                    userId: user.id,
                    bookId,
                    pageNumber: data.pageNumber,
                    highlightId: highlight.id,
                    type: "HIGHLIGHT",
                    content: data.noteContent,
                },
            });
        }

        const withNotes = await prisma.highlight.findUnique({
            where: { id: highlight.id },
            include: { notes: true },
        });
        return NextResponse.json({ highlight: withNotes }, { status: 201 });
    } catch (err) {
        return handleZod(err);
    }
}
