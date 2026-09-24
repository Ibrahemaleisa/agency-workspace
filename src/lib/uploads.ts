import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { del, get, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fileBlobs } from "@/db/schema";

/**
 * File storage, chosen by environment:
 * - Vercel Blob (private) when BLOB_READ_WRITE_TOKEN is set;
 * - the database on Vercel without a Blob store (its disk is not persistent);
 * - the local ./uploads folder otherwise.
 * Files are always served through /api/files/[id], which checks access first.
 */
const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const dbEnabled = () => !blobEnabled() && (!!process.env.VERCEL || process.env.FILE_STORAGE === "db");

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR)
  : path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");

// Vercel functions reject request bodies over 4.5 MB.
export const MAX_UPLOAD_BYTES = (process.env.VERCEL ? 4 : 20) * 1024 * 1024;

export async function saveFile(key: string, data: Buffer, contentType: string) {
  if (blobEnabled()) {
    await put(key, data, { access: "private", contentType, addRandomSuffix: false });
    return;
  }
  if (dbEnabled()) {
    await db.insert(fileBlobs).values({ key, data }).onConflictDoUpdate({ target: fileBlobs.key, set: { data } });
    return;
  }
  const filePath = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function loadFile(key: string): Promise<ReadableStream<Uint8Array> | Uint8Array | null> {
  if (blobEnabled()) {
    const res = await get(key, { access: "private" }).catch(() => null);
    return res?.statusCode === 200 ? res.stream : null;
  }
  if (dbEnabled()) {
    const row = await db.query.fileBlobs.findFirst({ where: eq(fileBlobs.key, key) });
    return row ? new Uint8Array(row.data) : null;
  }
  const filePath = path.join(UPLOAD_DIR, key);
  if (!filePath.startsWith(UPLOAD_DIR)) return null;
  return readFile(filePath).then((b) => new Uint8Array(b)).catch(() => null);
}

export async function removeFile(key: string) {
  if (blobEnabled()) await del(key).catch(() => {});
  else if (dbEnabled()) await db.delete(fileBlobs).where(eq(fileBlobs.key, key));
  else await unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
}
