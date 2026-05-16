"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useReaderStore } from "./reader-store";
import { ReaderToolbar } from "./reader-toolbar";
import { ReaderSidebar } from "./reader-sidebar";
import { NotesPanel } from "./notes-panel";
import type { BookDTO, HighlightDTO, NoteDTO, BookmarkDTO } from "@/lib/types";

const PdfReader = dynamic(() => import("./pdf-reader").then((m) => m.PdfReader), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Loading reader…
    </div>
  ),
});

export function ReaderApp({
  book,
  initialHighlights,
  initialNotes,
  initialBookmarks,
}: {
  book: BookDTO;
  initialHighlights: HighlightDTO[];
  initialNotes: NoteDTO[];
  initialBookmarks: BookmarkDTO[];
}) {
  const setBookId = useReaderStore((s) => s.setBookId);
  const setCurrentPage = useReaderStore((s) => s.setCurrentPage);
  const setTotalPages = useReaderStore((s) => s.setTotalPages);
  const setHighlights = useReaderStore((s) => s.setHighlights);
  const setNotes = useReaderStore((s) => s.setNotes);
  const setBookmarks = useReaderStore((s) => s.setBookmarks);
  const sidebarOpen = useReaderStore((s) => s.sidebarOpen);
  const notesOpen = useReaderStore((s) => s.notesOpen);

  useEffect(() => {
    setBookId(book.id);
    setCurrentPage(book.currentPage || 1);
    if (book.totalPages) setTotalPages(book.totalPages);
    setHighlights(initialHighlights);
    setNotes(initialNotes);
    setBookmarks(initialBookmarks);
  }, [
    book.id,
    book.currentPage,
    book.totalPages,
    initialHighlights,
    initialNotes,
    initialBookmarks,
    setBookId,
    setCurrentPage,
    setTotalPages,
    setHighlights,
    setNotes,
    setBookmarks,
  ]);

  return (
    <div className="flex h-screen flex-col bg-[var(--reader-bg)]">
      <ReaderToolbar book={book} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <ReaderSidebar />}
        <div className="flex-1 overflow-hidden">
          <PdfReader fileUrl={book.fileUrl} bookId={book.id} />
        </div>
        {notesOpen && <NotesPanel />}
      </div>
    </div>
  );
}
