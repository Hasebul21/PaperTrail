"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useReaderStore } from "./reader-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookmarkDTO } from "@/lib/types";

function jumpTo(page: number) {
    window.dispatchEvent(new CustomEvent("pt:scroll-to-page", { detail: { page } }));
}

export function BookmarksPanel() {
    const bookId = useReaderStore((s) => s.bookId);
    const bookmarks = useReaderStore((s) => s.bookmarks);
    const add = useReaderStore((s) => s.addBookmark);
    const update = useReaderStore((s) => s.updateBookmark);
    const remove = useReaderStore((s) => s.removeBookmark);
    const currentPage = useReaderStore((s) => s.currentPage);
    const [editing, setEditing] = useState<string | null>(null);
    const [label, setLabel] = useState("");
    const [note, setNote] = useState("");

    async function saveCurrent() {
        try {
            const res = await fetch(`/api/books/${bookId}/bookmarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageNumber: currentPage }),
            });
            if (!res.ok) throw new Error();
            const data = (await res.json()) as { bookmark: BookmarkDTO };
            add(data.bookmark);
            toast.success(`Saved page ${currentPage}`);
        } catch {
            toast.error("Could not save");
        }
    }

    async function onSaveEdit(id: string) {
        try {
            const res = await fetch(`/api/books/${bookId}/bookmarks/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: label || null, note: note || null }),
            });
            if (!res.ok) throw new Error();
            const data = (await res.json()) as { bookmark: BookmarkDTO };
            update(data.bookmark);
            setEditing(null);
            toast.success("Updated");
        } catch {
            toast.error("Failed");
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Remove this saved page?")) return;
        try {
            await fetch(`/api/books/${bookId}/bookmarks/${id}`, { method: "DELETE" });
            remove(id);
        } catch {
            toast.error("Failed");
        }
    }

    return (
        <div>
            <Button size="sm" variant="outline" onClick={saveCurrent} className="mb-2 w-full">
                <Plus className="h-4 w-4" /> Save current page ({currentPage})
            </Button>
            {bookmarks.length === 0 ? (
                <p className="px-2 text-xs text-neutral-500">No saved pages yet.</p>
            ) : (
                <ul className="thin-scrollbar max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto pr-1">
                    {bookmarks.map((b) => (
                        <li
                            key={b.id}
                            className="group rounded-md border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            {editing === b.id ? (
                                <div className="space-y-1.5">
                                    <Input
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        placeholder="Label"
                                    />
                                    <Textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Note"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={() => onSaveEdit(b.id)}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => jumpTo(b.pageNumber)}
                                            className="text-xs font-semibold text-neutral-700 hover:underline dark:text-neutral-200"
                                        >
                                            Page {b.pageNumber}
                                        </button>
                                        <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                                            <button
                                                onClick={() => {
                                                    setEditing(b.id);
                                                    setLabel(b.label ?? "");
                                                    setNote(b.note ?? "");
                                                }}
                                                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(b.id)}
                                                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {b.label && <p className="text-sm font-medium">{b.label}</p>}
                                    {b.note && <p className="mt-1 text-xs text-neutral-500">{b.note}</p>}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
