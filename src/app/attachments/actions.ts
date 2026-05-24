"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canManageScope } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/attachments";

function scopeForEntity(entityType: string) {
  return entityType === "company" || entityType === "inventory" ? "inventory" : "operations";
}

export async function uploadAttachment(formData: FormData) {
  const user = await getSessionUser();
  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "").trim();
  const file = formData.get("file");

  if (!user || !canManageScope(user.role, scopeForEntity(entityType) as "inventory" | "operations")) {
    throw new Error("You do not have permission to upload attachments.");
  }
  if (!entityType) throw new Error("Entity type is required");
  if (!entityId) throw new Error("Entity ID is required");
  if (!(file instanceof File) || file.size === 0) throw new Error("Attachment file is required");

  const saved = await saveUploadedFile(entityType, entityId, file);
  await prisma.attachment.create({
    data: {
      entityType,
      entityId,
      originalName: file.name,
      fileName: saved.fileName,
      mimeType: file.type || null,
      filePath: saved.filePath,
      fileUrl: saved.fileUrl
    }
  });

  revalidatePath(`/${entityType}/${entityId}`);
}
