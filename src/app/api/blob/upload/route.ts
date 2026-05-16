import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const body = (await req.json()) as HandleUploadBody;
    try {
        const json = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
                const user = await requireUser();
                if (!pathname.toLowerCase().endsWith(".pdf")) {
                    throw new Error("Only PDF files are supported");
                }
                return {
                    allowedContentTypes: ["application/pdf"],
                    maximumSizeInBytes: 50 * 1024 * 1024,
                    tokenPayload: JSON.stringify({ userId: user.id }),
                    addRandomSuffix: true,
                };
            },
        });
        return NextResponse.json(json);
    } catch (e) {
        return NextResponse.json(
            { error: (e as Error).message },
            { status: 400 }
        );
    }
}
