"use client";

import { Trash2 } from "lucide-react";
import { readRects } from "./highlight-utils";
import type { HighlightDTO } from "@/lib/types";

const colorClass: Record<string, string> = {
    yellow: "pt-highlight-yellow",
    green: "pt-highlight-green",
    blue: "pt-highlight-blue",
    pink: "pt-highlight-pink",
    purple: "pt-highlight-purple",
    orange: "pt-highlight-orange",
};

export function HighlightOverlay({
    pageNumber,
    highlights,
    onDelete,
}: {
    pageNumber: number;
    highlights: HighlightDTO[];
    onDelete: (id: string) => void;
}) {
    return (
        <div className="pointer-events-none absolute inset-0 z-10">
            {highlights.map((h) => {
                const rects = readRects(h);
                if (rects.length === 0) return null;
                return rects.map((r, i) => (
                    <button
                        key={`${h.id}-${i}`}
                        type="button"
                        data-highlight-id={h.id}
                        data-page={pageNumber}
                        title={`${h.selectedText.slice(0, 80)}${h.selectedText.length > 80 ? "…" : ""}\nClick to remove`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Remove this highlight?")) onDelete(h.id);
                        }}
                        className={`pt-highlight ${colorClass[h.color] ?? colorClass.yellow}`}
                        style={{
                            left: `${r.x * 100}%`,
                            top: `${r.y * 100}%`,
                            width: `${r.w * 100}%`,
                            height: `${r.h * 100}%`,
                        }}
                    >
                        <span className="sr-only">
                            <Trash2 className="h-3 w-3" /> Highlight
                        </span>
                    </button>
                ));
            })}
        </div>
    );
}
