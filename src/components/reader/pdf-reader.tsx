"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { toast } from "sonner";
import { useReaderStore } from "./reader-store";
import { HighlightSelectionPopover } from "./highlight-selection-popover";
import { HighlightOverlay } from "./highlight-overlay";
import { selectionToPageRects } from "./highlight-utils";
import "./pdf-worker";
import type { HighlightColor } from "@/lib/validations";
import type { HighlightDTO } from "@/lib/types";

type SelectionInfo = {
  pageNumber: number;
  text: string;
  rects: { x: number; y: number; w: number; h: number }[];
  clientX: number;
  clientY: number;
};

export function PdfReader({ fileUrl, bookId }: { fileUrl: string; bookId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  const zoom = useReaderStore((s) => s.zoom);
  const fitWidth = useReaderStore((s) => s.fitWidth);
  const setTotalPages = useReaderStore((s) => s.setTotalPages);
  const currentPage = useReaderStore((s) => s.currentPage);
  const setCurrentPage = useReaderStore((s) => s.setCurrentPage);
  const setSaveStatus = useReaderStore((s) => s.setSaveStatus);
  const selectedColor = useReaderStore((s) => s.selectedColor);
  const addHighlight = useReaderStore((s) => s.addHighlight);
  const removeHighlight = useReaderStore((s) => s.removeHighlight);
  const highlights = useReaderStore((s) => s.highlights);
  const addNote = useReaderStore((s) => s.addNote);

  // Compute page render width
  useEffect(() => {
    function update() {
      const w = containerRef.current?.clientWidth ?? 800;
      const base = Math.min(900, w - 64);
      setPageWidth(fitWidth ? base : base * zoom);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [zoom, fitWidth]);

  // Debounced progress save
  const saveTimer = useRef<number | null>(null);
  const lastSavedPage = useRef<number>(currentPage);

  const saveProgress = useCallback(
    (page: number) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSaveStatus("saving");
      saveTimer.current = window.setTimeout(async () => {
        try {
          const res = await fetch(`/api/books/${bookId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentPage: page,
              totalPages: numPages ?? undefined,
            }),
          });
          if (!res.ok) throw new Error("save failed");
          lastSavedPage.current = page;
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        } catch {
          setSaveStatus("error");
        }
      }, 600);
    },
    [bookId, numPages, setSaveStatus]
  );

  useEffect(() => {
    if (numPages && currentPage !== lastSavedPage.current) {
      saveProgress(currentPage);
    }
  }, [currentPage, numPages, saveProgress]);

  // Persist on unload
  useEffect(() => {
    function flush() {
      if (currentPage !== lastSavedPage.current) {
        const data = JSON.stringify({
          currentPage,
          totalPages: numPages ?? undefined,
        });
        navigator.sendBeacon?.(
          `/api/books/${bookId}/progress`,
          new Blob([data], { type: "application/json" })
        );
      }
    }
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, [bookId, currentPage, numPages]);

  // Page intersection observer to update currentPage on scroll
  useEffect(() => {
    if (!numPages) return;
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestPage: number | null = null;
        let bestRatio = 0;
        entries.forEach((entry) => {
          const p = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestPage = p;
          }
        });
        if (bestPage && bestPage !== currentPage) setCurrentPage(bestPage);
      },
      { root: container, threshold: [0.25, 0.5, 0.75] }
    );
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages, currentPage, setCurrentPage]);

  // Scroll to currentPage when changed via toolbar/sidebar
  const scrollPageRequestRef = useRef<number | null>(null);
  useEffect(() => {
    const onScrollRequest = (e: Event) => {
      const ev = e as CustomEvent<{ page: number }>;
      const page = ev.detail.page;
      scrollPageRequestRef.current = page;
      const el = pageRefs.current.get(page);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("pt:scroll-to-page", onScrollRequest);
    return () => window.removeEventListener("pt:scroll-to-page", onScrollRequest);
  }, []);

  // Selection handler — show popover near selection
  useEffect(() => {
    function onUp(e: MouseEvent) {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // find which page
      let pageEl: HTMLElement | null = null;
      let pageNumber = 0;
      pageRefs.current.forEach((el, p) => {
        if (el.contains(range.commonAncestorContainer)) {
          pageEl = el;
          pageNumber = p;
        }
      });
      if (!pageEl || !pageNumber) {
        setSelection(null);
        return;
      }
      const data = selectionToPageRects(pageEl, range);
      if (!data) {
        setSelection(null);
        return;
      }
      setSelection({
        pageNumber,
        text: data.text,
        rects: data.rects,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }
    function onDown() {
      setSelection(null);
    }
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  async function createHighlight(color: HighlightColor, withNote = false) {
    if (!selection) return;
    let noteContent: string | undefined;
    if (withNote) {
      const v = window.prompt("Add a note for this highlight (optional):", "");
      noteContent = v ?? undefined;
    }
    try {
      const res = await fetch(`/api/books/${bookId}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber: selection.pageNumber,
          selectedText: selection.text,
          color,
          rects: selection.rects,
          noteContent: noteContent || undefined,
        }),
      });
      if (!res.ok) throw new Error("highlight failed");
      const data = (await res.json()) as { highlight: HighlightDTO };
      addHighlight(data.highlight);
      if (noteContent && data.highlight.notes && data.highlight.notes[0]) {
        addNote(data.highlight.notes[0]);
      }
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      toast.success("Highlight saved");
    } catch {
      toast.error("Could not save highlight");
    }
  }

  async function deleteHighlight(id: string) {
    try {
      await fetch(`/api/books/${bookId}/highlights/${id}`, { method: "DELETE" });
      removeHighlight(id);
      toast.success("Highlight removed");
    } catch {
      toast.error("Failed");
    }
  }

  const pages = Array.from({ length: numPages ?? 0 }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className="thin-scrollbar relative h-full overflow-auto px-6 py-6"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages: n }) => {
          setNumPages(n);
          setTotalPages(n);
        }}
        onLoadError={(err) => {
          console.error(err);
          toast.error("Failed to load PDF");
        }}
        loading={
          <div className="py-20 text-center text-sm text-neutral-500">
            Loading document…
          </div>
        }
        className="flex flex-col items-center gap-6"
      >
        {pages.map((p) => (
          <div
            key={p}
            ref={(el) => {
              if (el) pageRefs.current.set(p, el);
              else pageRefs.current.delete(p);
            }}
            data-page-number={p}
            className="relative"
            style={{ width: pageWidth }}
          >
            <Page
              pageNumber={p}
              width={pageWidth}
              renderTextLayer
              renderAnnotationLayer={false}
            />
            <HighlightOverlay
              pageNumber={p}
              highlights={highlights.filter((h) => h.pageNumber === p)}
              onDelete={deleteHighlight}
            />
            <div className="absolute bottom-2 right-3 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {p}
            </div>
          </div>
        ))}
      </Document>

      {selection && (
        <HighlightSelectionPopover
          x={selection.clientX}
          y={selection.clientY}
          selectedColor={selectedColor}
          onPickColor={(c) => createHighlight(c, false)}
          onAddNote={() => createHighlight(selectedColor, true)}
        />
      )}
    </div>
  );
}
