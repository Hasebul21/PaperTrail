"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, BookOpen, Trash2, Pencil, ArrowRight } from "lucide-react";
import { BookUpload } from "./book-upload";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatRelative, formatDate, bytesToReadable } from "@/lib/utils";
import type { BookDTO } from "@/lib/types";

type SortKey = "recent" | "uploaded" | "progress" | "title";
type FilterKey = "all" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export function DashboardClient({ initialBooks }: { initialBooks: BookDTO[] }) {
  const [books, setBooks] = useState<BookDTO[]>(initialBooks);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState<FilterKey>("all");
  const router = useRouter();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = books;
    if (filter !== "all") list = list.filter((b) => b.status === filter);
    if (q)
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.fileName.toLowerCase().includes(q)
      );
    const sorted = [...list];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "uploaded":
        sorted.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        break;
      case "progress":
        sorted.sort((a, b) => b.progressPercentage - a.progressPercentage);
        break;
      case "recent":
      default:
        sorted.sort((a, b) => {
          const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return tb - ta;
        });
    }
    return sorted;
  }, [books, query, sort, filter]);

  function onUploaded(book: BookDTO) {
    setBooks((prev) => [book, ...prev]);
  }

  async function handleDelete(id: string) {
    const ok = confirm("Delete this book and all its notes, highlights, and bookmarks?");
    if (!ok) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Book deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleRename(id: string, title: string) {
    const res = await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      toast.error("Rename failed");
      return false;
    }
    const data = (await res.json()) as { book: BookDTO };
    setBooks((prev) => prev.map((b) => (b.id === id ? data.book : b)));
    toast.success("Renamed");
    return true;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
          <p className="text-sm text-neutral-500">
            {books.length === 0
              ? "No books yet — upload your first PDF to begin."
              : `${books.length} book${books.length === 1 ? "" : "s"} in your library.`}
          </p>
        </div>
        <BookUpload onUploaded={onUploaded} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or file name…"
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort: {sortLabel(sort)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSort("recent")}>Recently opened</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort("uploaded")}>Recently uploaded</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort("progress")}>Progress</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSort("title")}>Title A–Z</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Filter: {filterLabel(filter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Reading status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter("NOT_STARTED")}>Not started</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter("IN_PROGRESS")}>In progress</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter("COMPLETED")}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onDelete={() => handleDelete(book.id)}
              onRename={(t) => handleRename(book.id, t)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function sortLabel(s: SortKey) {
  return {
    recent: "Recently opened",
    uploaded: "Recently uploaded",
    progress: "Progress",
    title: "Title A–Z",
  }[s];
}
function filterLabel(f: FilterKey) {
  return {
    all: "All",
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
  }[f];
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-neutral-300 bg-white/40 p-10 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
      <BookOpen className="mx-auto h-8 w-8 text-neutral-400" />
      <p className="mt-3 text-sm font-medium">Nothing here yet</p>
      <p className="mt-1 text-sm text-neutral-500">
        Upload a PDF to get started.
      </p>
    </div>
  );
}

function BookCard({
  book,
  onDelete,
  onRename,
}: {
  book: BookDTO;
  onDelete: () => void;
  onRename: (title: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [saving, setSaving] = useState(false);
  const pct = Math.round(book.progressPercentage);

  return (
    <>
      <Card className="group flex flex-col overflow-hidden p-0">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <BookOpen className="h-10 w-10 text-neutral-400" />
          <div className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 backdrop-blur dark:bg-neutral-950/80 dark:text-neutral-200">
            {statusLabel(book.status)}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left text-base font-semibold leading-snug line-clamp-2 hover:underline"
          >
            {book.title}
          </button>
          <p className="mt-1 truncate text-xs text-neutral-500">{book.fileName}</p>

          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full bg-neutral-900 transition-all dark:bg-neutral-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>
                Page {book.currentPage}
                {book.totalPages ? ` / ${book.totalPages}` : ""}
              </span>
              <span>{pct}%</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span>Uploaded {formatRelative(book.uploadedAt)}</span>
            <span>Opened {formatRelative(book.lastOpenedAt)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/reader/${book.id}`}>
                <ArrowRight className="h-4 w-4" />
                Continue
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              Details
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{book.title}</DialogTitle>
            <DialogDescription>{book.fileName}</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Detail label="Pages">
              {book.currentPage}
              {book.totalPages ? ` / ${book.totalPages}` : ""}
            </Detail>
            <Detail label="Progress">{pct}%</Detail>
            <Detail label="Status">{statusLabel(book.status)}</Detail>
            <Detail label="Size">{bytesToReadable(book.size)}</Detail>
            <Detail label="Uploaded">{formatDate(book.uploadedAt)}</Detail>
            <Detail label="Last opened">{formatRelative(book.lastOpenedAt)}</Detail>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(true)}>
              <Pencil className="h-4 w-4" /> Rename
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button asChild>
              <Link href={`/reader/${book.id}`}>Open reader</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename book</DialogTitle>
          </DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !title.trim()}
              onClick={async () => {
                setSaving(true);
                const ok = await onRename(title.trim());
                setSaving(false);
                if (ok) setRenameOpen(false);
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </>
  );
}

function statusLabel(s: BookDTO["status"]) {
  if (s === "COMPLETED") return "Completed";
  if (s === "IN_PROGRESS") return "Reading";
  return "Not started";
}
