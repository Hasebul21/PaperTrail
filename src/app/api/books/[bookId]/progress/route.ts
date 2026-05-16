import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleZod } from "@/lib/api";
import { progressSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ bookId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { bookId } = await ctx.params;
    const body = await req.json();
    const { currentPage, totalPages, completed } = progressSchema.parse(body);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const total = totalPages ?? book.totalPages ?? null;
    const pct = total ? Math.min(100, Math.max(0, (currentPage / total) * 100)) : 0;
    const isDone = completed ?? (total ? currentPage >= total : false);
    const status = isDone ? "COMPLETED" : currentPage > 1 ? "IN_PROGRESS" : "NOT_STARTED";

    const now = new Date();

    const [updated] = await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: {
          currentPage,
          totalPages: total ?? undefined,
          progressPercentage: pct,
          lastOpenedAt: now,
          status,
        },
      }),
      prisma.readingProgress.upsert({
        where: { bookId },
        update: {
          currentPage,
          totalPages: total ?? undefined,
          progressPercentage: pct,
          lastReadAt: now,
        },
        create: {
          userId: user.id,
          bookId,
          currentPage,
          totalPages: total ?? undefined,
          progressPercentage: pct,
        },
      }),
    ]);

    return NextResponse.json({ book: updated });
  } catch (err) {
    return handleZod(err);
  }
}
