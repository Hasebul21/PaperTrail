import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect("/sign-in");

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="h-5 w-5" />
                        PaperTrail
                    </Link>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="hidden text-neutral-500 sm:inline">
                            {session.user.email}
                        </span>
                        <form action={signOutAction}>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
