import { z } from "zod";

export const HIGHLIGHT_COLORS = [
    "yellow",
    "green",
    "blue",
    "pink",
    "purple",
    "orange",
] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const signUpSchema = z.object({
    name: z.string().min(1).max(80).optional().nullable(),
    email: z.string().email(),
    password: z.string().min(6).max(128),
});

export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const updateBookSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    totalPages: z.number().int().positive().optional(),
});

export const progressSchema = z.object({
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().positive().optional(),
    completed: z.boolean().optional(),
});

export const createHighlightSchema = z.object({
    pageNumber: z.number().int().positive(),
    selectedText: z.string().min(1).max(5000),
    color: z.enum(HIGHLIGHT_COLORS),
    rects: z.any().optional(),
    noteContent: z.string().max(10000).optional(),
});

export const updateHighlightSchema = z.object({
    color: z.enum(HIGHLIGHT_COLORS).optional(),
    selectedText: z.string().min(1).max(5000).optional(),
});

export const createNoteSchema = z.object({
    type: z.enum(["BOOK", "PAGE", "HIGHLIGHT"]),
    content: z.string().min(1).max(10000),
    pageNumber: z.number().int().positive().optional().nullable(),
    highlightId: z.string().optional().nullable(),
});

export const updateNoteSchema = z.object({
    content: z.string().min(1).max(10000),
});

export const createBookmarkSchema = z.object({
    pageNumber: z.number().int().positive(),
    label: z.string().max(120).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
});

export const updateBookmarkSchema = z.object({
    label: z.string().max(120).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
});
