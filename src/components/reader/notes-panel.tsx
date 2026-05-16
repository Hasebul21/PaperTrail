"use client";

import { X } from "lucide-react";
import { useReaderStore } from "./reader-store";
import { NotesList } from "./notes-list";

export function NotesPanel() {
    const close = useReaderStore((s) => s.toggleNotes);

    return (
        <aside className="thin-scrollbar flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <p className="text-sm font-semibold">Notes</p>
                <button
                    onClick={close}
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <NotesList />
        </aside>
    );
}
