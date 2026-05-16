"use client";

import { pdfjs } from "react-pdf";

// Use the worker bundled by pdfjs-dist. Importing via URL keeps it client-only
// and Vercel-friendly (no need to copy the worker file into public/).
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export { pdfjs };
