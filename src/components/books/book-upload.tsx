"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookDTO } from "@/lib/types";

export function BookUpload({ onUploaded }: { onUploaded: (book: BookDTO) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState(false);
    const [progress, setProgress] = useState(0);

    function pick() {
        inputRef.current?.click();
    }

    function handleFile(file: File) {
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are supported.");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File too large (max 50 MB).");
            return;
        }
        const fd = new FormData();
        fd.append("file", file);

        setPending(true);
        setProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/books");
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            setPending(false);
            setProgress(0);
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText) as { book: BookDTO };
                toast.success("Book uploaded");
                onUploaded(data.book);
            } else {
                let msg = "Upload failed";
                try {
                    msg = (JSON.parse(xhr.responseText)?.error as string) ?? msg;
                } catch { }
                toast.error(msg);
            }
        };
        xhr.onerror = () => {
            setPending(false);
            toast.error("Network error during upload");
        };
        xhr.send(fd);
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
