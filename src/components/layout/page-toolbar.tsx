"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams } from "next/navigation";
import { Copy, Printer, Share2 } from "lucide-react";

export function PageToolbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";
  const url = `${pathname}${query ? `?${query}` : ""}`;
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button type="button" variant="secondary" onClick={() => window.print()} className="gap-2">
        <Printer className="h-4 w-4" />
        Print / Save as PDF
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
        {status === "copied" ? "Copied" : "Copy URL"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        onClick={() => {
          if (navigator.share) {
            void navigator.share({ title: document.title, url }).then(
              () => setStatus("shared"),
              () => setStatus("error")
            );
          } else {
            void navigator.clipboard.writeText(window.location.href).then(
              () => setStatus("copied"),
              () => setStatus("error")
            );
          }
        }}
      >
        <Share2 className="h-4 w-4" />
        {status === "shared" ? "Shared" : status === "error" ? "Try again" : "Share page"}
      </Button>
    </div>
  );
}
