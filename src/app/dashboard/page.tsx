import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/books/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const books = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: [
      { lastOpenedAt: { sort: "desc", nulls: "last" } },
      { uploadedAt: "desc" },
    ],
  });
  return <DashboardClient initialBooks={JSON.parse(JSON.stringify(books))} />;
}
