import path from "path";
import { mkdir, writeFile } from "fs/promises";

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function saveUploadedFile(entityType: string, entityId: string, file: File) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", entityType);
  await mkdir(uploadsDir, { recursive: true });

  const safeName = sanitizeFileName(file.name || "attachment");
  const fileName = `${entityId}-${Date.now()}-${safeName}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    fileUrl: `/uploads/${entityType}/${fileName}`
  };
}
