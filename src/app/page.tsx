import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Highlighter, Bookmark, NotebookPen } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
    const session = await auth();
    if (session?.user) redirect("/dashboard");

    return (
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
            <header className="flex items-center justify-between py-6">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                    <BookOpen className="h-5 w-5" />
                    PaperTrail
                </Link>
                <nav className="flex items-center gap-2">
                    <Button asChild variant="ghost">
                        <Link href="/sign-in">Sign in</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">Get started</Link>
                    </Button>
                </nav>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/60 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                    A calm place to read your PDFs
                </div>
                <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-6xl">
                    The reader, like Preview —<br /> with memory.
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-balance text-neutral-600 dark:text-neutral-400">
                    Upload books, read them in a clean Preview-style viewer, highlight in
                    six colors, jot notes, save pages and never lose your place again.
                </p>
                <div className="mt-8 flex items-center gap-3">
                    <Button asChild size="lg">
                        <Link href="/sign-up">Create your library</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/sign-in">I already have one</Link>
                    </Button>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Feature icon={<BookOpen className="h-5 w-5" />} title="Clean reader" desc="A focused, distraction-free reading surface inspired by macOS Preview." />
                    <Feature icon={<Highlighter className="h-5 w-5" />} title="Six colors" desc="Highlight passages and attach notes per highlight." />
                    <Feature icon={<NotebookPen className="h-5 w-5" />} title="Notes" desc="Book, page, and highlight notes — searchable and exportable." />
                    <Feature icon={<Bookmark className="h-5 w-5" />} title="Bookmarks" desc="Save any page, label it, jump back in seconds." />
                </div>
            </main>
        </div>
    );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white/60 p-5 text-left backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                {icon}
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{desc}</p>
        </div>
    );
}
