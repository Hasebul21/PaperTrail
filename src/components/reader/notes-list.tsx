"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useReaderStore } from "./reader-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { NoteDTO } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

function jumpTo(page: number) {
  window.dispatchEvent(new CustomEvent("pt:scroll-to-page", { detail: { page } }));
}

export function NotesList({ compact = false }: { compact?: boolean }) {
  const bookId = useReaderStore((s) => s.bookId);
  const currentPage = useReaderStore((s) => s.currentPage);
  const notes = useReaderStore((s) => s.notes);
  const add = useReaderStore((s) => s.addNote);
  const update = useReaderStore((s) => s.updateNote);
  const remove = useReaderStore((s) => s.removeNote);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"current" | "all" | "highlight">("current");

  const grouped = useMemo(() => {
    const all = [...notes];
    return {
      all,
      current: all.filter((n) => n.pageNumber === currentPage || n.type === "BOOK"),
      highlight: all.filter((n) => n.type === "HIGHLIGHT"),
    };
  }, [notes, currentPage]);

  async function addNoteForCurrentPage() {
    const content = window.prompt(`Add a note for page ${currentPage}:`);
    if (!content || !content.trim()) return;
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAGE",
          content: content.trim(),
          pageNumber: currentPage,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { note: NoteDTO };
      add(data.note);
      toast.success("Note added");
    } catch {
      toast.error("Failed");
    }
  }

  async function addBookNote() {
    const content = window.prompt("Add a book-level note:");
    if (!content || !content.trim()) return;
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BOOK",
          content: content.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { note: NoteDTO };
      add(data.note);
      toast.success("Note added");
    } catch {
      toast.error("Failed");
    }
  }

  async function onSaveEdit(id: string) {
    try {
      const res = await fetch(`/api/books/${bookId}/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { note: NoteDTO };
      update(data.note);
      setEditingId(null);
      toast.success("Saved");
    } catch {
      toast.error("Failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await fetch(`/api/books/${bookId}/notes/${id}`, { method: "DELETE" });
      remove(id);
    } catch {
      toast.error("Failed");
    }
  }

  function renderItem(n: NoteDTO) {
    return (
      <li
        key={n.id}
        className="group rounded-md border border-neutral-200 bg-white p-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {n.type}
            </span>
            {n.pageNumber ? (
              <button
                onClick={() => jumpTo(n.pageNumber!)}
                className="hover:underline"
              >
                Page {n.pageNumber}
              </button>
            ) : (
              <span>Book note</span>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => {
                setEditingId(n.id);
                setDraft(n.content);
              }}
              className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(n.id)}
              className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {n.highlight && (
          <p className="mt-1 line-clamp-2 rounded bg-yellow-50 px-1.5 py-0.5 text-xs italic text-neutral-700 dark:bg-yellow-950 dark:text-neutral-200">
            “{n.highlight.selectedText}”
          </p>
        )}
        {editingId === n.id ? (
          <div className="mt-2 space-y-1.5">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => onSaveEdit(n.id)}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">
            {n.content}
          </p>
        )}
        <p className="mt-1.5 text-[10px] text-neutral-400">
          Updated {formatRelative(n.updatedAt)}
        </p>
      </li>
    );
  }

  const list = grouped[view];

  return (
    <div className={compact ? "" : "p-3"}>
      <div className="mb-2 flex gap-1">
        <Button size="sm" variant="outline" onClick={addNoteForCurrentPage} className="flex-1">
          <Plus className="h-4 w-4" /> Page note
        </Button>
        <Button size="sm" variant="outline" onClick={addBookNote} className="flex-1">
          <Plus className="h-4 w-4" /> Book note
        </Button>
      </div>
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="highlight">From marks</TabsTrigger>
        </TabsList>
        <TabsContent value={view}>
          {list.length === 0 ? (
            <p className="px-1 py-4 text-xs text-neutral-500">No notes here.</p>
          ) : (
            <ul className="thin-scrollbar max-h-[calc(100vh-14rem)] space-y-2 overflow-y-auto pr-1">
              {list.map(renderItem)}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
