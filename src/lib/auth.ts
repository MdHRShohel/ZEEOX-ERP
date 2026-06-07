import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthRole } from "@prisma/client";

const COOKIE_NAME = "erp_session";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export interface SessionPayload {
  id: string;
  username: string;
  displayName: string;
  role: AuthRole;
  exp: number;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const data: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(encoded);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}

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

export function canAccessRoute(role: AuthRole, pathname: string): boolean {
  if (pathname === "/login" || pathname === "/403") return true;
  if (pathname.startsWith("/purchases") || pathname.startsWith("/suppliers")) {
    return role === "admin";
  }
  if (pathname.startsWith("/settings") || pathname.startsWith("/adjustments")) {
    return role === "admin";
  }
  if (pathname.startsWith("/users") || pathname.startsWith("/audit")) {
    return role === "admin";
  }
  if (pathname.startsWith("/receipts") || pathname.startsWith("/transfers")) {
    return role === "admin" || role === "staff";
  }
  if (pathname.startsWith("/products") || pathname.startsWith("/customers")) {
    return role === "admin" || role === "staff";
  }
  if (pathname.startsWith("/sales") || pathname.startsWith("/returns")) {
    return role === "admin" || role === "staff";
  }
  return true;
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

export { COOKIE_NAME };
