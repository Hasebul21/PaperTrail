import { NextResponse } from "next/server";
import { z } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleZod(err: unknown) {
  if (err instanceof z.ZodError) {
    return jsonError(err.issues[0]?.message ?? "Invalid input", 422);
  }
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return jsonError("Unauthorized", 401);
  }
  if (err instanceof Error && err.message === "NOT_FOUND") {
    return jsonError("Not found", 404);
  }
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return jsonError("Forbidden", 403);
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}
