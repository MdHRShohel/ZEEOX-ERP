"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReturn } from "./actions";

export default function CreateReturnForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New Return</Button>;
  }

  async function handleSubmit(formData: FormData) {
    const result = await createReturn(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">New Return</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="returnNo">Return Number</Label>
            <Input id="returnNo" name="returnNo" required placeholder="RET-001" />
          </div>
          <div>
            <Label htmlFor="type">Return Type</Label>
            <Select id="type" name="type" required>
              <option value="">Select type…</option>
              <option value="customer_return">Customer Return</option>
              <option value="supplier_return">Supplier Return</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="returnDate">Return Date</Label>
            <Input id="returnDate" name="returnDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
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
