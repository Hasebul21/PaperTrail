import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { createNoteSchema } from "@/lib/validations";

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
        const notes = await prisma.note.findMany({
            where: { bookId, userId: user.id },
            include: { highlight: true },
            orderBy: [{ pageNumber: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
        });
        return NextResponse.json({ notes });
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
        const data = createNoteSchema.parse(body);
        const note = await prisma.note.create({
            data: {
                userId: user.id,
                bookId,
                type: data.type,
                content: data.content,
                pageNumber: data.pageNumber ?? null,
                highlightId: data.highlightId ?? null,
            },
            include: { highlight: true },
        });
        return NextResponse.json({ note }, { status: 201 });
    } catch (err) {
        return handleZod(err);
    }
}
