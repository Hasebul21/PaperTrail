"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
    const [state, formAction, pending] = useActionState<AuthState, FormData>(
        signInAction,
        undefined
    );

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-neutral-500">Sign in to your PaperTrail library.</p>
            </div>
            <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </div>
                {state?.error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                        {state.error}
                    </p>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "Signing in…" : "Sign in"}
                </Button>
            </form>
            <p className="text-center text-sm text-neutral-500">
                New here?{" "}
                <Link href="/sign-up" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                    Create an account
                </Link>
            </p>
        </div>
    );
}
