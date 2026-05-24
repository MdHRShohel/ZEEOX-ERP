import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = scryptSync(password, salt, keyLength);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
}
