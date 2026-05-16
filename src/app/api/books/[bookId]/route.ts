import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deletePdf } from "@/lib/storage";
import { handleZod } from "@/lib/api";
import { updateBookSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string }> };

async function loadOwned(bookId: string, userId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("NOT_FOUND");
  if (book.userId !== userId) throw new Error("FORBIDDEN");
  return book;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId } = await ctx.params;
    const book = await loadOwned(bookId, user.id);
    return NextResponse.json({ book });
  } catch (err) {
    return handleZod(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId } = await ctx.params;
    await loadOwned(bookId, user.id);
    const body = await req.json();
    const data = updateBookSchema.parse(body);
    const book = await prisma.book.update({ where: { id: bookId }, data });
    return NextResponse.json({ book });
  } catch (err) {
    return handleZod(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId } = await ctx.params;
    const book = await loadOwned(bookId, user.id);
    await prisma.book.delete({ where: { id: bookId } });
    await deletePdf(book.fileUrl).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZod(err);
  }
}
