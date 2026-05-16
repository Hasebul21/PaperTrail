import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReaderApp } from "@/components/reader/reader-app";

export const dynamic = "force-dynamic";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireUser();
  const { bookId } = await params;

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      highlights: { include: { notes: true }, orderBy: [{ pageNumber: "asc" }] },
      notes: { include: { highlight: true }, orderBy: [{ createdAt: "desc" }] },
      bookmarks: { orderBy: { pageNumber: "asc" } },
    },
  });
  if (!book || book.userId !== user.id) notFound();

  const data = JSON.parse(JSON.stringify(book));
  return (
    <ReaderApp
      book={data}
      initialHighlights={data.highlights}
      initialNotes={data.notes}
      initialBookmarks={data.bookmarks}
    />
  );
}
