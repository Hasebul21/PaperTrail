"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useReaderStore } from "./reader-store";

function jumpTo(page: number) {
  window.dispatchEvent(new CustomEvent("pt:scroll-to-page", { detail: { page } }));
}

const dotClass: Record<string, string> = {
  yellow: "bg-yellow-300",
  green: "bg-green-400",
  blue: "bg-blue-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
};

export function HighlightsPanel() {
  const highlights = useReaderStore((s) => s.highlights);
  const bookId = useReaderStore((s) => s.bookId);
  const remove = useReaderStore((s) => s.removeHighlight);

  async function onDelete(id: string) {
    if (!confirm("Remove this highlight?")) return;
    try {
      await fetch(`/api/books/${bookId}/highlights/${id}`, { method: "DELETE" });
      remove(id);
      toast.success("Removed");
    } catch {
      toast.error("Failed");
    }
  }

  if (highlights.length === 0) {
    return <p className="px-2 text-xs text-neutral-500">No highlights yet. Select text to start.</p>;
  }

  return (
    <ul className="thin-scrollbar max-h-[calc(100vh-9rem)] space-y-2 overflow-y-auto pr-1">
      {highlights.map((h) => (
        <li
          key={h.id}
          className="group rounded-md border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => jumpTo(h.pageNumber)}
              className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:underline dark:text-neutral-300"
            >
              <span className={`h-2 w-2 rounded-full ${dotClass[h.color] ?? dotClass.yellow}`} />
              Page {h.pageNumber}
            </button>
            <button
              onClick={() => onDelete(h.id)}
              className="rounded p-1 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              title="Delete highlight"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 line-clamp-4 text-neutral-800 dark:text-neutral-200">
            “{h.selectedText}”
          </p>
          {h.notes && h.notes.length > 0 && (
            <p className="mt-1 line-clamp-3 text-xs text-neutral-500">
              Note: {h.notes[0].content}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
