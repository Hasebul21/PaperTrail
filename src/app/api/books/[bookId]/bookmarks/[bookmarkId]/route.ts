import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { updateBookmarkSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string; bookmarkId: string }> };

async function assertOwn(bookmarkId: string, bookId: string, userId: string) {
  const b = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
  if (!b || b.bookId !== bookId) throw new Error("NOT_FOUND");
  if (b.userId !== userId) throw new Error("FORBIDDEN");
  return b;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, bookmarkId } = await ctx.params;
    await assertOwn(bookmarkId, bookId, user.id);
    const body = await req.json();
    const data = updateBookmarkSchema.parse(body);
    const bookmark = await prisma.bookmark.update({ where: { id: bookmarkId }, data });
    return NextResponse.json({ bookmark });
  } catch (err) {
    return handleZod(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, bookmarkId } = await ctx.params;
    await assertOwn(bookmarkId, bookId, user.id);
    await prisma.bookmark.delete({ where: { id: bookmarkId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZod(err);
  }
}
