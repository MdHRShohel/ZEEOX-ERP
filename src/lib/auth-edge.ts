import type { AuthRole } from "@prisma/client";

export type { AuthRole };
export const COOKIE_NAME = "erp_session";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
  id: string;
  username: string;
  displayName: string;
  role: AuthRole;
  exp: number;
}

function secretBytes(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");
}

function toBase64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexDecode(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)));
}

async function hmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    secretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const data: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL };
  const encoded = toBase64url(JSON.stringify(data));
  const key = await hmacKey("sign");
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${hexEncode(sig)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey("verify");
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      hexDecode(sig),
      new TextEncoder().encode(encoded)
    );
    if (!valid) return null;
    const payload = JSON.parse(fromBase64url(encoded)) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function canAccessRoute(role: AuthRole, pathname: string): boolean {
  if (pathname === "/login" || pathname === "/403") return true;
  if (pathname.startsWith("/purchases") || pathname.startsWith("/suppliers")) return role === "admin";
  if (pathname.startsWith("/settings") || pathname.startsWith("/adjustments")) return role === "admin";
  if (pathname.startsWith("/users") || pathname.startsWith("/audit")) return role === "admin";
  if (pathname.startsWith("/receipts") || pathname.startsWith("/transfers")) return role === "admin" || role === "staff";
  if (pathname.startsWith("/products") || pathname.startsWith("/customers")) return role === "admin" || role === "staff";
  if (pathname.startsWith("/sales") || pathname.startsWith("/returns")) return role === "admin" || role === "staff";
  return true;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export interface PermissionSet {
  canManageProducts: boolean;
  canManageSuppliers: boolean;
  canManageWarehouses: boolean;
  canManagePurchases: boolean;
  canReceiveGoods: boolean;
  canTransferStock: boolean;
  canAdjustStock: boolean;
  canManageCustomers: boolean;
  canManageSales: boolean;
  canManageReturns: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canViewAudit: boolean;
  canManageSettings: boolean;
}

export function getPermissions(role: AuthRole): PermissionSet {
  const isAdmin = role === "admin";
  const isStaff = role === "admin" || role === "staff";
  return {
    canManageProducts: isStaff,
    canManageSuppliers: isAdmin,
    canManageWarehouses: isAdmin,
    canManagePurchases: isAdmin,
    canReceiveGoods: isStaff,
    canTransferStock: isStaff,
    canAdjustStock: isAdmin,
    canManageCustomers: isStaff,
    canManageSales: isStaff,
    canManageReturns: isStaff,
    canViewReports: true,
    canManageUsers: isAdmin,
    canViewAudit: isAdmin,
    canManageSettings: isAdmin,
  };
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export function getNavItems(role: AuthRole): NavGroup[] {
  const isAdmin = role === "admin";
  const isStaff = role === "admin" || role === "staff";

  const groups: NavGroup[] = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
        { label: "Reports", href: "/reports", icon: "BarChart3" },
      ],
    },
    {
      group: "Inventory",
      items: [
        ...(isStaff ? [{ label: "Products", href: "/products", icon: "Package" }] : []),
        ...(isAdmin ? [{ label: "Stock Adjustments", href: "/adjustments", icon: "ArrowUpDown" }] : []),
        ...(isStaff ? [{ label: "Stock Transfers", href: "/transfers", icon: "ArrowLeftRight" }] : []),
      ],
    },
    {
      group: "Procurement",
      items: [
        ...(isAdmin ? [{ label: "Suppliers", href: "/suppliers", icon: "Building2" }] : []),
        ...(isAdmin ? [{ label: "Purchase Orders", href: "/purchases", icon: "ShoppingCart" }] : []),
        ...(isStaff ? [{ label: "Goods Receipts", href: "/receipts", icon: "PackageCheck" }] : []),
      ],
    },
    {
      group: "Sales",
      items: [
        ...(isStaff ? [{ label: "Customers", href: "/customers", icon: "Users" }] : []),
        ...(isStaff ? [{ label: "Sales Orders", href: "/sales/orders", icon: "ClipboardList" }] : []),
        ...(isStaff ? [{ label: "Invoices", href: "/sales/invoices", icon: "FileText" }] : []),
        ...(isStaff ? [{ label: "Returns", href: "/returns", icon: "RotateCcw" }] : []),
      ],
    },
    {
      group: "Administration",
      items: [
        ...(isAdmin ? [{ label: "Users", href: "/users", icon: "UserCog" }] : []),
        ...(isAdmin ? [{ label: "Audit Log", href: "/audit", icon: "History" }] : []),
        ...(isAdmin ? [{ label: "Settings", href: "/settings", icon: "Settings" }] : []),
      ],
    },
  ];

  return groups.filter((g) => g.items.length > 0);
}
