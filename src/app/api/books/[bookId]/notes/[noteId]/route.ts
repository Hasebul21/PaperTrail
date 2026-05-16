import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { updateNoteSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string; noteId: string }> };

async function assertOwn(noteId: string, bookId: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.bookId !== bookId) throw new Error("NOT_FOUND");
  if (note.userId !== userId) throw new Error("FORBIDDEN");
  return note;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, noteId } = await ctx.params;
    await assertOwn(noteId, bookId, user.id);
    const body = await req.json();
    const data = updateNoteSchema.parse(body);
    const note = await prisma.note.update({
      where: { id: noteId },
      data,
      include: { highlight: true },
    });
    return NextResponse.json({ note });
  } catch (err) {
    return handleZod(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, noteId } = await ctx.params;
    await assertOwn(noteId, bookId, user.id);
    await prisma.note.delete({ where: { id: noteId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZod(err);
  }
}
