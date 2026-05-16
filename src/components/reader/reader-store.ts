"use client";

import { create } from "zustand";
import type { HighlightDTO, NoteDTO, BookmarkDTO } from "@/lib/types";
import type { HighlightColor } from "@/lib/validations";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ReaderState = {
    bookId: string;
    currentPage: number;
    totalPages: number | null;
    zoom: number;
    fitWidth: boolean;
    sidebarOpen: boolean;
    notesOpen: boolean;
    sidebarTab: "pages" | "notes" | "highlights" | "bookmarks";
    selectedColor: HighlightColor;
    saveStatus: SaveStatus;

    highlights: HighlightDTO[];
    notes: NoteDTO[];
    bookmarks: BookmarkDTO[];

    setBookId: (id: string) => void;
    setCurrentPage: (n: number) => void;
    setTotalPages: (n: number) => void;
    setZoom: (z: number) => void;
    toggleSidebar: () => void;
    toggleNotes: () => void;
    setSidebarTab: (t: ReaderState["sidebarTab"]) => void;
    setSelectedColor: (c: HighlightColor) => void;
    setFitWidth: (b: boolean) => void;
    setSaveStatus: (s: SaveStatus) => void;

    setHighlights: (h: HighlightDTO[]) => void;
    setNotes: (n: NoteDTO[]) => void;
    setBookmarks: (b: BookmarkDTO[]) => void;

    addHighlight: (h: HighlightDTO) => void;
    removeHighlight: (id: string) => void;
    updateHighlight: (h: HighlightDTO) => void;

    addNote: (n: NoteDTO) => void;
    removeNote: (id: string) => void;
    updateNote: (n: NoteDTO) => void;

    addBookmark: (b: BookmarkDTO) => void;
    removeBookmark: (id: string) => void;
    updateBookmark: (b: BookmarkDTO) => void;
};

export const useReaderStore = create<ReaderState>((set) => ({
    bookId: "",
    currentPage: 1,
    totalPages: null,
    zoom: 1,
    fitWidth: true,
    sidebarOpen: true,
    notesOpen: false,
    sidebarTab: "pages",
    selectedColor: "yellow",
    saveStatus: "idle",
    highlights: [],
    notes: [],
    bookmarks: [],

    setBookId: (id) => set({ bookId: id }),
    setCurrentPage: (n) => set({ currentPage: n }),
    setTotalPages: (n) => set({ totalPages: n }),
    setZoom: (z) => set({ zoom: z, fitWidth: false }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    toggleNotes: () => set((s) => ({ notesOpen: !s.notesOpen })),
    setSidebarTab: (t) => set({ sidebarTab: t, sidebarOpen: true }),
    setSelectedColor: (c) => set({ selectedColor: c }),
    setFitWidth: (b) => set({ fitWidth: b }),
    setSaveStatus: (s) => set({ saveStatus: s }),

    setHighlights: (h) => set({ highlights: h }),
    setNotes: (n) => set({ notes: n }),
    setBookmarks: (b) => set({ bookmarks: b }),

    addHighlight: (h) => set((s) => ({ highlights: [...s.highlights, h] })),
    removeHighlight: (id) =>
        set((s) => ({
            highlights: s.highlights.filter((h) => h.id !== id),
            notes: s.notes.filter((n) => n.highlightId !== id),
        })),
    updateHighlight: (h) =>
        set((s) => ({ highlights: s.highlights.map((x) => (x.id === h.id ? h : x)) })),

    addNote: (n) => set((s) => ({ notes: [n, ...s.notes] })),
    removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    updateNote: (n) =>
        set((s) => ({ notes: s.notes.map((x) => (x.id === n.id ? n : x)) })),

    addBookmark: (b) =>
        set((s) => ({
            bookmarks: [...s.bookmarks, b].sort((a, c) => a.pageNumber - c.pageNumber),
        })),
    removeBookmark: (id) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    updateBookmark: (b) =>
        set((s) => ({ bookmarks: s.bookmarks.map((x) => (x.id === b.id ? b : x)) })),
}));
