"use client";

import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/validations";
import { MessageSquarePlus } from "lucide-react";

const swatchClass: Record<HighlightColor, string> = {
  yellow: "bg-yellow-300",
  green: "bg-green-400",
  blue: "bg-blue-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
};

export function HighlightSelectionPopover({
  x,
  y,
  selectedColor,
  onPickColor,
  onAddNote,
}: {
  x: number;
  y: number;
  selectedColor: HighlightColor;
  onPickColor: (c: HighlightColor) => void;
  onAddNote: () => void;
}) {
  // Position above the cursor; clamp to viewport
  const left = Math.max(12, Math.min(window.innerWidth - 280, x - 140));
  const top = Math.max(12, y - 60);
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[60] flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      style={{ left, top }}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPickColor(c)}
          aria-label={`Highlight ${c}`}
          className={`h-6 w-6 rounded-full ring-offset-2 transition hover:scale-110 ${swatchClass[c]} ${
            selectedColor === c ? "ring-2 ring-neutral-700 dark:ring-neutral-200" : ""
          }`}
        />
      ))}
      <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
      <button
        type="button"
        onClick={onAddNote}
        title="Highlight with note"
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Note
      </button>
    </div>
  );
}
