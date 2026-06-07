"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPayment } from "../actions";

export default function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return <Button onClick={() => setOpen(true)} variant="outline">Record Payment</Button>;
  }

  async function handleSubmit(formData: FormData) {
    const result = await recordPayment(formData);
    if (result?.error) setError(result.error);
    else setOpen(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-white mb-4">Record Payment</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="salesInvoiceId" value={invoiceId} />
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null); }}>Cancel</Button>
            <Button type="submit">Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
