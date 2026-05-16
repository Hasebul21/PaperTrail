export type BookDTO = {
    id: string;
    userId: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    size: number;
    totalPages: number | null;
    currentPage: number;
    progressPercentage: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    uploadedAt: string;
    lastOpenedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type HighlightDTO = {
    id: string;
    userId: string;
    bookId: string;
    pageNumber: number;
    selectedText: string;
    color: string;
    rects: unknown;
    createdAt: string;
    updatedAt: string;
    notes?: NoteDTO[];
};

export type NoteDTO = {
    id: string;
    userId: string;
    bookId: string;
    pageNumber: number | null;
    highlightId: string | null;
    type: "BOOK" | "PAGE" | "HIGHLIGHT";
    content: string;
    createdAt: string;
    updatedAt: string;
    highlight?: HighlightDTO | null;
};

export type BookmarkDTO = {
    id: string;
    userId: string;
    bookId: string;
    pageNumber: number;
    label: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
};
