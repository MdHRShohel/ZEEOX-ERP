import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsersOverview } from "@/server/services/users-service";
import PageHeader from "@/components/layout/page-header";
import ModuleStats from "@/components/layout/module-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import CreateUserForm from "./create-form";
import { toggleUserActive } from "./actions";

const ROLE_COLORS = { admin: "danger", staff: "default", viewer: "muted" } as const;

export default async function UsersPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageUsers) redirect("/403");

  const { users, total, byRole } = await getUsersOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        breadcrumbs={[{ label: "Users", href: "/users" }]}
        action={<CreateUserForm />}
      />

      <ModuleStats
        stats={[
          { label: "Total Users", value: total },
          { label: "Admins", value: byRole.admin ?? 0 },
          { label: "Staff", value: byRole.staff ?? 0 },
          { label: "Viewers", value: byRole.viewer ?? 0 },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Display Name</Th>
                <Th>Username</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium text-white">{u.displayName}</Td>
                  <Td className="font-mono text-sm text-slate-300">{u.username}</Td>
                  <Td>
                    <Badge variant={ROLE_COLORS[u.role] ?? "muted"}>{u.role}</Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.isActive ? "success" : "muted"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="text-slate-400 text-sm">{formatDateTime(u.createdAt)}</Td>
                  <Td>
                    {u.id !== session.id && (
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
