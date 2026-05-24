import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/server/services/audit-service";

export const dynamic = "force-dynamic";

const auditSchema = z.object({
  entity: z.string().min(1),
  action: z.string().min(1),
  payload: z.unknown().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = auditSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid audit payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const record = await logAuditEvent(parsed.data);
  return NextResponse.json(record, { status: 201 });
}

