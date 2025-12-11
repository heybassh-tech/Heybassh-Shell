import crypto from "crypto";

// Encryption key - should be stored in environment variables
// For production, use: process.env.PASSWORD_ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || "default-encryption-key-change-in-production-32-chars!!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For GCM, 12 bytes is recommended but 16 works
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypts a password using AES-256-GCM
 * Returns base64-encoded string: iv:salt:tag:ciphertext
 */
export function encryptPassword(password: string): string {
  if (!password) {
    throw new Error("Password cannot be empty");
  }

  // Generate random IV and salt
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key from encryption key and salt
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, "sha256");

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(password, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Combine: iv:salt:tag:ciphertext
  return `${iv.toString("base64")}:${salt.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts a password using AES-256-GCM
 * Input format: iv:salt:tag:ciphertext (all base64)
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) {
    throw new Error("Encrypted password cannot be empty");
  }

  try {
    // Split the encrypted string
    const parts = encryptedPassword.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted password format");
    }

    const [ivBase64, saltBase64, tagBase64, ciphertext] = parts;

    // Decode from base64
    const iv = Buffer.from(ivBase64, "base64");
    const salt = Buffer.from(saltBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");

    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, "sha256");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt password");
  }
}
