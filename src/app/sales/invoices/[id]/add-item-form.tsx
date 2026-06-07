"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Product = { id: string; sku: string; name: string; costPrice?: number; salePrice?: number };

interface Props {
  invoiceId: string;
  products: Product[];
  addAction: (fd: FormData) => Promise<{ error?: string; success?: boolean } | void>;
}

export default function AddInvoiceItemForm({ invoiceId, products, addAction }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await addAction(formData);
    if (result?.error) setError(result.error);
    else setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Line Item</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="hidden" name="salesInvoiceId" value={invoiceId} />
          <div className="md:col-span-2">
            <Label htmlFor="productVariantId">Product</Label>
            <Select id="productVariantId" name="productVariantId" required>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" type="number" min="1" required />
          </div>
          <div>
            <Label htmlFor="unitPrice">Sale Price</Label>
            <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required />
          </div>
          <div>
            <Label htmlFor="costPrice">Cost Price</Label>
            <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
          <div className="md:col-span-5">
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
