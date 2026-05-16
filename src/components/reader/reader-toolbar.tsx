"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Sidebar,
    StickyNote,
    ZoomIn,
    ZoomOut,
    Maximize2,
    CheckCircle2,
    Loader2,
    CircleAlert,
    Bookmark as BookmarkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useReaderStore } from "./reader-store";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/validations";
import type { BookDTO, BookmarkDTO } from "@/lib/types";

export function ReaderToolbar({ book }: { book: BookDTO }) {
    const currentPage = useReaderStore((s) => s.currentPage);
    const totalPages = useReaderStore((s) => s.totalPages);
    const zoom = useReaderStore((s) => s.zoom);
    const setZoom = useReaderStore((s) => s.setZoom);
    const setFitWidth = useReaderStore((s) => s.setFitWidth);
    const toggleSidebar = useReaderStore((s) => s.toggleSidebar);
    const toggleNotes = useReaderStore((s) => s.toggleNotes);
    const selectedColor = useReaderStore((s) => s.selectedColor);
    const setSelectedColor = useReaderStore((s) => s.setSelectedColor);
    const saveStatus = useReaderStore((s) => s.saveStatus);
    const setCurrentPage = useReaderStore((s) => s.setCurrentPage);
    const addBookmark = useReaderStore((s) => s.addBookmark);

    function jumpTo(page: number) {
        if (!totalPages) return;
        const p = Math.max(1, Math.min(totalPages, page));
        setCurrentPage(p);
        window.dispatchEvent(new CustomEvent("pt:scroll-to-page", { detail: { page: p } }));
    }

    async function quickBookmark() {
        try {
            const res = await fetch(`/api/books/${book.id}/bookmarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageNumber: currentPage }),
            });
            if (!res.ok) throw new Error();
            const data = (await res.json()) as { bookmark: BookmarkDTO };
            addBookmark(data.bookmark);
            toast.success(`Bookmarked page ${currentPage}`);
        } catch {
            toast.error("Could not bookmark");
        }
    }

    async function markCompleted() {
        if (!totalPages) {
            toast.error("Total pages unknown yet");
            return;
        }
        try {
            await fetch(`/api/books/${book.id}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPage: totalPages,
                    totalPages,
                    completed: true,
                }),
            });
            setCurrentPage(totalPages);
            toast.success("Marked as completed");
        } catch {
            toast.error("Could not update");
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement | null)?.tagName;
            const inField =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                (e.target as HTMLElement | null)?.isContentEditable;
            if (inField) return;

            const isMod = e.metaKey || e.ctrlKey;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                jumpTo(currentPage + 1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                jumpTo(currentPage - 1);
            } else if (isMod && (e.key === "=" || e.key === "+")) {
                e.preventDefault();
                setZoom(Math.min(3, +(zoom + 0.1).toFixed(2)));
            } else if (isMod && e.key === "-") {
                e.preventDefault();
                setZoom(Math.max(0.5, +(zoom - 0.1).toFixed(2)));
            } else if (!isMod && (e.key === "b" || e.key === "B")) {
                e.preventDefault();
                quickBookmark();
            } else if (!isMod && (e.key === "n" || e.key === "N")) {
                e.preventDefault();
                toggleNotes();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, zoom, totalPages]);

    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white/90 px-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
            <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Library</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Toggle sidebar">
                <Sidebar className="h-4 w-4" />
            </Button>

            <div className="hidden min-w-0 flex-1 px-2 sm:block">
                <p className="truncate text-sm font-medium">{book.title}</p>
            </div>
            <div className="flex-1 sm:hidden" />

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => jumpTo(currentPage - 1)} title="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <PageJumper
                    page={currentPage}
                    total={totalPages}
                    onJump={jumpTo}
                />
                <Button variant="ghost" size="icon" onClick={() => jumpTo(currentPage + 1)} title="Next page">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="hidden items-center gap-1 md:flex">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, +(zoom - 0.1).toFixed(2)))} title="Zoom out">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-xs tabular-nums">
                    {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, +(zoom + 0.1).toFixed(2)))} title="Zoom in">
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setFitWidth(true); setZoom(1); }} title="Fit to width">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>

            <ColorPicker color={selectedColor} onChange={setSelectedColor} />

            <Button variant="ghost" size="icon" onClick={quickBookmark} title="Bookmark page (B)">
                <BookmarkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleNotes} title="Notes (N)">
                <StickyNote className="h-4 w-4" />
            </Button>

            <SaveIndicator status={saveStatus} />

            <Button size="sm" variant="outline" onClick={markCompleted} className="hidden lg:inline-flex">
                Mark completed
            </Button>
        </header>
    );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
    if (status === "idle") return null;
    const map = {
        saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: "Saving" },
        saved: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />, text: "Saved" },
        error: { icon: <CircleAlert className="h-3.5 w-3.5 text-red-600" />, text: "Save failed" },
    } as const;
    const { icon, text } = map[status];
    return (
        <span className="hidden items-center gap-1 text-xs text-neutral-500 sm:inline-flex">
            {icon}
            {text}
        </span>
    );
}

function PageJumper({
    page,
    total,
    onJump,
}: {
    page: number;
    total: number | null;
    onJump: (n: number) => void;
}) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const v = Number(new FormData(e.currentTarget).get("page"));
                if (Number.isFinite(v) && v > 0) onJump(v);
            }}
            className="flex items-center gap-1 text-xs"
        >
            <Input
                key={page}
                name="page"
                defaultValue={page}
                className="h-7 w-14 text-center tabular-nums"
            />
            <span className="text-neutral-500">/ {total ?? "—"}</span>
        </form>
    );
}

function ColorPicker({
    color,
    onChange,
}: {
    color: HighlightColor;
    onChange: (c: HighlightColor) => void;
}) {
    const swatch: Record<HighlightColor, string> = {
        yellow: "bg-yellow-300",
        green: "bg-green-400",
        blue: "bg-blue-400",
        pink: "bg-pink-400",
        purple: "bg-purple-400",
        orange: "bg-orange-400",
    };
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Highlight color"
                    className={`h-6 w-6 rounded-full ring-1 ring-neutral-300 dark:ring-neutral-700 ${swatch[color]}`}
                />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2">
                <div className="flex items-center gap-1.5">
                    {HIGHLIGHT_COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onChange(c)}
                            aria-label={c}
                            className={`h-6 w-6 rounded-full ${swatch[c]} ${color === c ? "ring-2 ring-neutral-800 dark:ring-neutral-100" : ""
                                }`}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
