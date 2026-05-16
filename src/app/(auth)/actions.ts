"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";

export type AuthState = { error?: string } | undefined;

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: (formData.get("name") as string) || null,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name: name ?? null, passwordHash },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Account created. Please sign in." };
  }
  redirect("/dashboard");
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Invalid email or password." };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
