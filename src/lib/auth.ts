import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  verifySessionToken,
  canAccessRoute,
  COOKIE_NAME,
  SessionPayload,
  getPermissions,
  getNavItems,
  PermissionSet,
  NavItem,
  NavGroup,
} from "./auth-edge";
import type { AuthRole } from "@prisma/client";

export type { SessionPayload, AuthRole, PermissionSet, NavItem, NavGroup };
export { createSessionToken, verifySessionToken, canAccessRoute, COOKIE_NAME, getPermissions, getNavItems };

// ─── Server-only session helpers ─────────────────────────────────────────────

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
