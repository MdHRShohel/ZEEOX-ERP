import { cookies } from "next/headers";

export const authCookieName = "zeeox_session";

export type AuthRole = "admin" | "staff" | "viewer";
export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: AuthRole;
};

type AuthPayload = AuthUser & {
  exp: number;
  iat: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getAuthSecret() {
  return getRequiredEnv("AUTH_SECRET");
}

export function getLoginCredentials() {
  const adminUsername = process.env.AUTH_ADMIN_USERNAME?.trim();
  const adminPassword = process.env.AUTH_ADMIN_PASSWORD?.trim();
  const staffUsername = process.env.AUTH_STAFF_USERNAME?.trim();
  const staffPassword = process.env.AUTH_STAFF_PASSWORD?.trim();
  const viewerUsername = process.env.AUTH_VIEWER_USERNAME?.trim();
  const viewerPassword = process.env.AUTH_VIEWER_PASSWORD?.trim();

  if (!adminUsername || !adminPassword || !staffUsername || !staffPassword || !viewerUsername || !viewerPassword) {
    return [];
  }

  return [
    {
      username: adminUsername,
      password: adminPassword,
      role: "admin" as const
    },
    {
      username: staffUsername,
      password: staffPassword,
      role: "staff" as const
    },
    {
      username: viewerUsername,
      password: viewerPassword,
      role: "viewer" as const
    }
  ];
}

export type PermissionSet = {
  canViewDashboard: boolean;
  canViewReports: boolean;
  canViewAudit: boolean;
  canManageCompany: boolean;
  canManageInventory: boolean;
  canManageProduction: boolean;
  canManageSales: boolean;
  canManageCourier: boolean;
  canManageExpenses: boolean;
  canManageOperations: boolean;
  canDeleteRecords: boolean;
  canManageUsers: boolean;
};

export function getPermissions(role: AuthRole) {
  const base: PermissionSet = {
    canViewDashboard: true,
    canViewReports: true,
    canViewAudit: role === "admin",
    canManageCompany: role === "admin",
    canManageInventory: role === "admin",
    canManageProduction: role === "admin" || role === "staff",
    canManageSales: role === "admin" || role === "staff",
    canManageCourier: role === "admin" || role === "staff",
    canManageExpenses: role === "admin" || role === "staff",
    canManageOperations: role === "admin" || role === "staff",
    canDeleteRecords: role === "admin",
    canManageUsers: role === "admin"
  };

  return base;
}

export type ActionScope = "company" | "inventory" | "production" | "sales" | "courier" | "expenses" | "operations";

export function canManageScope(role: AuthRole, scope: ActionScope) {
  if (scope === "company" || scope === "inventory") return role === "admin";
  if (scope === "production" || scope === "sales" || scope === "courier" || scope === "expenses" || scope === "operations") {
    return role === "admin" || role === "staff";
  }
  return false;
}

export function canAccessRoute(role: AuthRole, pathname: string) {
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/reports") return true;
  if (pathname.startsWith("/audit")) return role === "admin";
  if (pathname.startsWith("/company") || pathname.startsWith("/inventory")) return role === "admin";
  if (pathname.startsWith("/production") || pathname.startsWith("/sales") || pathname.startsWith("/courier") || pathname.startsWith("/expenses")) {
    return role === "admin" || role === "staff";
  }
  if (pathname.startsWith("/api/reports")) return true;
  if (pathname.startsWith("/users")) return role === "admin";
  return role === "admin";
}

export function getVisibleNavItems(role: AuthRole) {
  const items = [
    {
      label: "Dashboard",
      href: "/dashboard",
      group: "Overview",
      description: "Snapshot of activity and performance",
      roles: ["admin", "staff", "viewer"] as AuthRole[]
    },
    { label: "Reports", href: "/reports", group: "Overview", description: "Filtered summaries and exports", roles: ["admin", "staff", "viewer"] as AuthRole[] },
    { label: "Company", href: "/company", group: "Business", description: "Owners, investors, and profile", roles: ["admin"] as AuthRole[] },
    { label: "Inventory", href: "/inventory", group: "Business", description: "Products, stock, and variants", roles: ["admin"] as AuthRole[] },
    { label: "Production", href: "/production", group: "Business", description: "Batch output and costs", roles: ["admin", "staff"] as AuthRole[] },
    { label: "Sales", href: "/sales", group: "Business", description: "Invoices and profit tracking", roles: ["admin", "staff"] as AuthRole[] },
    { label: "Courier", href: "/courier", group: "Business", description: "Delivery, return, and tracking", roles: ["admin", "staff"] as AuthRole[] },
    { label: "Expenses", href: "/expenses", group: "Business", description: "Office and overhead costs", roles: ["admin", "staff"] as AuthRole[] },
    { label: "Audit", href: "/audit", group: "Administration", description: "Activity history and logs", roles: ["admin"] as AuthRole[] },
    { label: "Users", href: "/users", group: "Administration", description: "Role-based account management", roles: ["admin"] as AuthRole[] }
  ];

  return items.filter((item) => item.roles.includes(role)).map(({ roles, ...item }) => item);
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  if (hex.length % 2 !== 0) throw new Error("Invalid token");
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}

async function hmac(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(new Uint8Array(signature));
}

export async function createSessionToken(user: AuthUser) {
  const payload: AuthPayload = {
    ...user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  };
  const encoded = toHex(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const expected = await hmac(encoded);
    if (expected !== signature) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromHex(encoded))) as AuthPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id ?? payload.username,
      username: payload.username,
      displayName: payload.displayName ?? payload.username,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const token = cookies().get(authCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
