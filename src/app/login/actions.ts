"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authCookieName, createSessionToken, getLoginCredentials } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "staff" | "viewer";
};

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard");
  const user = await prisma.user.findUnique({
    where: { username }
  });

  let authenticatedUser: SessionUser | null = user && user.isActive && verifyPassword(password, user.passwordHash)
    ? {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    : null;
  if (!authenticatedUser) {
    const account = getLoginCredentials().find((entry) => entry.username === username && entry.password === password);
    if (account && (await prisma.user.count()) === 0) {
      authenticatedUser = {
        id: "bootstrap",
        username: account.username,
        displayName: account.username,
        role: account.role
      };
    }
  }

  if (!authenticatedUser) {
    redirect(`/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  if (authenticatedUser.id !== "bootstrap") {
    await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: { lastLoginAt: new Date() }
    });
  }

  const token = await createSessionToken({
    id: authenticatedUser.id,
    username: authenticatedUser.username,
    displayName: authenticatedUser.displayName,
    role: authenticatedUser.role
  });
  cookies().set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
}

export async function logoutAction() {
  cookies().delete(authCookieName);
  redirect("/login");
}
