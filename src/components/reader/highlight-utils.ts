"use client";

import type { HighlightDTO } from "@/lib/types";

export type NormalizedRect = {
  // Normalized to PDF page (0..1)
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Convert a window Selection inside a rendered react-pdf page element into
 * an array of normalized rectangles relative to the page (0..1 coords).
 * Returns null if the selection is empty or outside the page.
 */
export function selectionToPageRects(
  pageEl: HTMLElement,
  range: Range
): { rects: NormalizedRect[]; text: string } | null {
  const text = range.toString().trim();
  if (!text) return null;
  const pageBox = pageEl.getBoundingClientRect();
  const raw = Array.from(range.getClientRects());
  if (raw.length === 0) return null;
  const rects: NormalizedRect[] = raw
    .map((r) => ({
      x: (r.left - pageBox.left) / pageBox.width,
      y: (r.top - pageBox.top) / pageBox.height,
      w: r.width / pageBox.width,
      h: r.height / pageBox.height,
    }))
    .filter((r) => r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= 1.02);
  if (rects.length === 0) return null;
  return { rects, text };
}

export function readRects(h: HighlightDTO): NormalizedRect[] {
  const r = h.rects as NormalizedRect[] | null | undefined;
  return Array.isArray(r) ? r : [];
}
