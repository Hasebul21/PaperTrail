# PaperTrail

A calm, Preview-style PDF reader for the web. Upload your books, read them in a clean interface, highlight passages in six colors, take notes, save pages, and pick up exactly where you left off.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn-style UI · Prisma · PostgreSQL · Auth.js · Vercel Blob · react-pdf**.

---

## Features

- 🔐 **Auth** — email + password (Auth.js / NextAuth v5 with the Prisma adapter). All books, notes, highlights and bookmarks are scoped to the signed-in user.
- 📚 **Library dashboard** — upload PDFs (≤ 50 MB), see covers/title/file/progress, rename, delete, search, sort (recent / uploaded / progress / title) and filter (not started / in progress / completed).
- 📖 **Preview-style reader** — clean centered document area, page-by-page scroll, smooth navigation, sidebar tabs (Pages / Notes / Marks / Saved), zoom in/out, fit to width, jump-to-page, previous/next.
- 💾 **Resume reading** — current page is debounced-saved as you scroll/navigate and flushed on unload with `sendBeacon`. Reopening a book jumps straight to your last page. Manual "Mark completed" available.
- 🖍 **Highlights in 6 colors** — select any text and pick yellow / green / blue / pink / purple / orange. Highlights persist by storing the selected text, page number, color, and normalized rectangle coordinates so they re-render at any zoom level.
- 🗒 **Notes** — book-level, page-level and highlight-level notes with edit/delete. Tabs filter to current page, all, or notes attached to highlights.
- 🔖 **Bookmarks** — save the current page (with optional label / note), jump back instantly, edit, delete.
- ⌨️ **Keyboard shortcuts** — `←` `→` `↑` `↓` page navigation, `⌘/Ctrl ±` zoom, `B` bookmark current page, `N` toggle notes panel.
- 🎨 Polished UI with toasts, empty / loading / error states.

---

## Tech stack

| Concern        | Choice                                                                |
| -------------- | --------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, Turbopack)                          |
| Language       | TypeScript (strict)                                                   |
| Styling        | Tailwind CSS v4                                                       |
| UI primitives  | Radix UI + shadcn-style wrappers, lucide-react icons, sonner toasts   |
| State          | Zustand (reader-local), React server components for the library       |
| Auth           | Auth.js v5 (`next-auth@beta`) with Credentials + Prisma adapter (JWT) |
| Database       | PostgreSQL via Prisma ORM                                             |
| File storage   | Vercel Blob (works seamlessly on Vercel)                              |
| PDF rendering  | `react-pdf` (pdfjs-dist 5)                                            |

---

## Required environment variables

Copy `.env.example` → `.env` and fill in:

| Variable                | Required | Description                                                                                                       |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | ✅       | PostgreSQL connection string (Vercel Postgres, Neon, Supabase, Railway, local Postgres, …)                        |
| `AUTH_SECRET`           | ✅       | Random string for JWT signing. Generate: `openssl rand -base64 32`                                                |
| `NEXTAUTH_URL`          | ⚠️ local | App URL. Auto-inferred on Vercel; set to `http://localhost:3000` locally.                                         |
| `BLOB_READ_WRITE_TOKEN` | ✅       | Vercel Blob token. Create a Blob store in your Vercel project → "Storage" tab → it gets injected automatically.   |
| `NEXT_PUBLIC_APP_URL`   | optional | Canonical URL of the deployed app.                                                                                |

---

## Local development

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# edit DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN

# 3. Push schema to your database (creates tables)
npm run db:push
#   or, for a tracked migration:
# npm run db:migrate

# 4. Dev server
npm run dev
```

Open <http://localhost:3000>, sign up, upload a PDF and start reading.

> If you don't want to set up Vercel Blob locally, the dashboard and auth still work, but uploads will return a clear error. Real storage is required for end-to-end use.

---

## Deploying to Vercel

1. **Create the project.**
   ```bash
   git push   # push to GitHub
   ```
   Then import the repository on [vercel.com/new](https://vercel.com/new).

2. **Add a Postgres database** — either Vercel Postgres (Storage tab → "Create database" → Postgres) or Neon / Supabase / any managed Postgres. Vercel Postgres auto-injects `DATABASE_URL`.

3. **Add a Blob store** — Storage tab → "Create" → Blob. This injects `BLOB_READ_WRITE_TOKEN` automatically.

4. **Set remaining env vars** in Project Settings → Environment Variables:
   - `AUTH_SECRET` (generate locally with `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your production URL)

5. **Apply the schema** to the production database — either:
   - Pull env and push from your machine: `vercel env pull .env.production && npx prisma db push`, or
   - Add `prisma migrate deploy` to the build, e.g. change `build` to `prisma generate && prisma migrate deploy && next build`.

6. **Redeploy.** The Prisma client is generated automatically (`postinstall` + `build`).

---

## Project layout

```
src/
├── app/
│   ├── (auth)/                  sign-in, sign-up, server actions
│   ├── api/                     auth + REST routes (books, progress,
│   │                            highlights, notes, bookmarks)
│   ├── dashboard/               library
│   └── reader/[bookId]/         the Preview-style reader
├── components/
│   ├── books/                   dashboard + upload
│   ├── reader/                  PdfReader, toolbar, sidebar, panels,
│   │                            highlight logic, Zustand store
│   └── ui/                      shadcn-style primitives
└── lib/                         auth, db, storage, validations, utils
prisma/
└── schema.prisma                User, Book, ReadingProgress,
                                 Highlight, Note, Bookmark + Auth.js tables
```

---

## Notes & limitations

- **Highlights are coordinate-based.** When you select text the app captures the rectangles relative to the rendered page (normalized 0–1) and stores them alongside the selected text. On reload they re-render correctly at any zoom level. Selections that span across columns or unusual text layouts produce multiple rects, which is intended.
- **Page count detection.** Total pages are discovered on first open via PDF.js and persisted on the first progress save.
- **Thumbnails.** The sidebar currently shows a page list (with current-page highlight) rather than rendered thumbnails — this keeps the bundle small and rendering snappy on long PDFs. Thumbnails can be added by rendering a small `<Page>` per item.
- **Search inside PDF.** Not implemented in the MVP. The text layer is enabled, so the browser-native `⌘/Ctrl + F` works for currently visible pages.
- **Max upload.** 50 MB (configurable in `src/app/api/books/route.ts`).

---

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build (runs prisma generate first)
npm run start        # serve the production build
npm run lint         # eslint
npm run db:push      # sync Prisma schema to DB (no migration history)
npm run db:migrate   # create + apply a migration
npm run db:studio    # open Prisma Studio
```

---

## License

MIT
