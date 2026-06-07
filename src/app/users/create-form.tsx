"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUser } from "./actions";

export default function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New User</Button>;
  }

  async function handleSubmit(formData: FormData) {
    const result = await createUser(formData);
    if (result?.error) setError(result.error);
    else { setOpen(false); setError(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">Create User</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" name="displayName" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" required>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null); }}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
