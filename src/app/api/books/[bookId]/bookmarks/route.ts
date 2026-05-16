import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { createBookmarkSchema } from "@/lib/validations";

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
    const bookmarks = await prisma.bookmark.findMany({
      where: { bookId, userId: user.id },
      orderBy: { pageNumber: "asc" },
    });
    return NextResponse.json({ bookmarks });
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
    const data = createBookmarkSchema.parse(body);
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        bookId,
        pageNumber: data.pageNumber,
        label: data.label ?? null,
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (err) {
    return handleZod(err);
  }
}
