import crypto from "crypto";

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedKey] = storedHash.split(":");
  if (!salt || !expectedKey) {
    return false;
  }

  const actualKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedKey, "hex");

  if (actualKey.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualKey, expectedBuffer);
}

export function createResetToken() {
  return crypto.randomBytes(24).toString("hex");
}
