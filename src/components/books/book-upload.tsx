"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import type { BookDTO } from "@/lib/types";

export function BookUpload({ onUploaded }: { onUploaded: (book: BookDTO) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState(false);
    const [progress, setProgress] = useState(0);

    function pick() {
        inputRef.current?.click();
    }

    async function handleFile(file: File) {
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are supported.");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File too large (max 50 MB).");
            return;
        }

        setPending(true);
        setProgress(0);

        try {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/blob/upload",
                contentType: file.type,
                onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
            });

            const res = await fetch("/api/books", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    url: blob.url,
                    fileName: file.name,
                    size: file.size,
                }),
            });
            if (!res.ok) {
                const msg = (await res.json().catch(() => null))?.error ?? "Upload failed";
                throw new Error(msg);
            }
            const data = (await res.json()) as { book: BookDTO };
            toast.success("Book uploaded");
            onUploaded(data.book);
        } catch (e) {
            toast.error((e as Error).message || "Upload failed");
        } finally {
            setPending(false);
            setProgress(0);
        }
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
            />
            <Button onClick={pick} disabled={pending}>
                {pending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading {progress}%
                    </>
                ) : (
                    <>
                        <Upload className="h-4 w-4" />
                        Upload PDF
                    </>
                )}
            </Button>
        </div>
    );
}
