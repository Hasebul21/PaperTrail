"use client";

import { useReaderStore } from "./reader-store";

function jumpTo(page: number) {
    window.dispatchEvent(new CustomEvent("pt:scroll-to-page", { detail: { page } }));
}

export function PageNavigator() {
    const total = useReaderStore((s) => s.totalPages);
    const current = useReaderStore((s) => s.currentPage);

    if (!total) {
        return (
            <p className="px-2 text-xs text-neutral-500">Loading pages…</p>
        );
    }

    return (
        <ul className="thin-scrollbar max-h-[calc(100vh-9rem)] overflow-y-auto">
            {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                <li key={p}>
                    <button
                        onClick={() => jumpTo(p)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition ${p === current
                                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            }`}
                    >
                        <span>Page {p}</span>
                        {p === current && <span className="text-[10px] uppercase opacity-80">Current</span>}
                    </button>
                </li>
            ))}
        </ul>
    );
}
