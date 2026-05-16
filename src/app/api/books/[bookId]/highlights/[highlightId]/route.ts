import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { updateHighlightSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string; highlightId: string }> };

async function assertOwn(highlightId: string, bookId: string, userId: string) {
  const hl = await prisma.highlight.findUnique({ where: { id: highlightId } });
  if (!hl || hl.bookId !== bookId) throw new Error("NOT_FOUND");
  if (hl.userId !== userId) throw new Error("FORBIDDEN");
  return hl;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, highlightId } = await ctx.params;
    await assertOwn(highlightId, bookId, user.id);
    const body = await req.json();
    const data = updateHighlightSchema.parse(body);
    const highlight = await prisma.highlight.update({
      where: { id: highlightId },
      data,
      include: { notes: true },
    });
    return NextResponse.json({ highlight });
  } catch (err) {
    return handleZod(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId, highlightId } = await ctx.params;
    await assertOwn(highlightId, bookId, user.id);
    await prisma.highlight.delete({ where: { id: highlightId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZod(err);
  }
}
