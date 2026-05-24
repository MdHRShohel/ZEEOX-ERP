"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Printer, Download } from "lucide-react";

export function InvoiceToolbar({ backHref, downloadHref }: { backHref: string; downloadHref: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "printed" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link
        href={downloadHref}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Link>
      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        onClick={() => {
          window.print();
          setStatus("printed");
        }}
      >
        <Printer className="h-4 w-4" />
        {status === "printed" ? "Print dialog open" : "Save as PDF"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        onClick={() => {
          void navigator.clipboard.writeText(window.location.href).then(
            () => setStatus("copied"),
            () => setStatus("error")
          );
        }}
      >
        <Copy className="h-4 w-4" />
        {status === "copied" ? "Copied" : status === "error" ? "Try again" : "Copy link"}
      </Button>
      <Link
        href={backHref}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sales
      </Link>
    </div>
  );
}
