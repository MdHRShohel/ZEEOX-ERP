import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUser, deleteUser, toggleUserStatus, updateUser } from "@/app/users/actions";
import { Pagination } from "@/components/layout/pagination";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { getUsersOverview, hasUsersDatabase } from "@/server/services/users-service";
import { paginate, parsePage } from "@/lib/pagination";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function UsersPage({
  searchParams
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") redirect("/dashboard");

  const permissions = getPermissions(sessionUser.role);
  const search = String(searchParams?.q ?? "");
  const page = parsePage(searchParams?.page);
  const overview = await getUsersOverview({ search });
  const paginatedUsers = paginate(overview.users, page, 6);

  return (
    <ModulePage
      title="User Management"
      description="Create and maintain admin, staff, and viewer accounts with role-based access and activation controls."
      sections={[
        { label: "Accounts", href: "#accounts" },
        { label: "Create user", href: "#create-user" },
        { label: "Roles", href: "#roles" }
      ]}
      stats={[
        { label: "Users", value: overview.userCount, help: "Total accounts" },
        { label: "Active", value: overview.activeCount, help: "Enabled accounts" },
        { label: "Admins", value: overview.adminCount, help: "Full access" },
        { label: "Staff / Viewer", value: overview.staffCount + overview.viewerCount, help: "Limited access" }
      ]}
      items={[
        { title: "Role control", detail: "Assign admin, staff, or viewer access per account." },
        { title: "Status control", detail: "Disable accounts without deleting their record." },
        { title: "Security", detail: "Passwords are hashed and can be rotated on update." }
      ]}
    >
      <Card id="overview">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="flex flex-1 flex-col gap-3 md:flex-row" action="/users" method="get">
            <div className="space-y-2 md:flex-1">
              <Label htmlFor="q">Search users</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Username or display name" />
            </div>
            <Button type="submit">Search</Button>
            {search ? (
              <a href="/users" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </a>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{hasUsersDatabase() ? "Database connected" : "No database"}</div>
        </CardContent>
      </Card>

      <Card id="roles">
        <CardHeader>
          <CardTitle>Role matrix</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-medium">Admin</p>
            <p className="mt-1 text-slate-600">Full access to users, company, inventory, and operational modules.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-medium">Staff</p>
            <p className="mt-1 text-slate-600">Operational access for sales, courier, production, and expenses.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-medium">Viewer</p>
            <p className="mt-1 text-slate-600">Read-only access for dashboard and reporting.</p>
          </div>
        </CardContent>
      </Card>

      {permissions.canManageUsers ? (
        <FormSection title="Create user">
          <div id="create-user" />
          <form action={createUser} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue="viewer">
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                  <option value="viewer">viewer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input id="isActive" name="isActive" type="checkbox" defaultChecked />
                <Label htmlFor="isActive">Active account</Label>
              </div>
            </div>
            <Button type="submit">Create user</Button>
          </form>
        </FormSection>
      ) : null}

      <Card id="accounts">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paginatedUsers.items.length === 0 ? (
            <p className="text-sm text-slate-600">No users found.</p>
          ) : (
            paginatedUsers.items.map((user) => (
              <div key={user.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-slate-600">@{user.username}</p>
                    <p className="text-xs text-slate-500">Last login: {user.lastLoginAt ? user.lastLoginAt.toLocaleString() : "Never"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{user.role}</Badge>
                    <Badge className={user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>{user.isActive ? "active" : "inactive"}</Badge>
                    {permissions.canManageUsers ? (
                      <form action={toggleUserStatus}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button type="submit" variant="secondary">{user.isActive ? "Disable" : "Enable"}</Button>
                      </form>
                    ) : null}
                    {permissions.canManageUsers ? (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <Button type="submit" variant="destructive">Delete</Button>
                      </form>
                    ) : null}
                  </div>
                </div>

                {permissions.canManageUsers ? (
                  <form action={updateUser} className="mt-4 grid gap-3 border-t pt-4">
                    <input type="hidden" name="id" value={user.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`username-${user.id}`}>Username</Label>
                        <Input id={`username-${user.id}`} name="username" defaultValue={user.username} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`displayName-${user.id}`}>Display name</Label>
                        <Input id={`displayName-${user.id}`} name="displayName" defaultValue={user.displayName} required />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${user.id}`}>Role</Label>
                        <Select id={`role-${user.id}`} name="role" defaultValue={user.role}>
                          <option value="admin">admin</option>
                          <option value="staff">staff</option>
                          <option value="viewer">viewer</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`password-${user.id}`}>New password</Label>
                        <Input id={`password-${user.id}`} name="password" type="password" placeholder="Leave blank to keep current" />
                      </div>
                      <div className="flex items-end gap-2 pb-1">
                        <input id={`isActive-${user.id}`} name="isActive" type="checkbox" defaultChecked={user.isActive} />
                        <Label htmlFor={`isActive-${user.id}`}>Active account</Label>
                      </div>
                    </div>
                    <Button type="submit">Update user</Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
          <Pagination
            basePath="/users"
            page={paginatedUsers.page}
            totalPages={paginatedUsers.totalPages}
            params={{ q: search || undefined }}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}
