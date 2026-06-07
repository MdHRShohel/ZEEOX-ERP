"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  // Bootstrap: env credentials for initial setup when no users exist in DB
  const bootstrapUser = process.env.BOOTSTRAP_ADMIN_USER;
  const bootstrapPass = process.env.BOOTSTRAP_ADMIN_PASS;
  if (bootstrapUser && bootstrapPass && username === bootstrapUser && password === bootstrapPass) {
    const token = createSessionToken({
      id: "bootstrap",
      username: bootstrapUser,
      displayName: "Admin (Bootstrap)",
      role: "admin",
    });
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: 7 * 24 * 60 * 60, sameSite: "lax" });
    redirect(next);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return { error: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid credentials" };
  }

  const token = createSessionToken({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: 7 * 24 * 60 * 60, sameSite: "lax" });
  redirect(next);
}
