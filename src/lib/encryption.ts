import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Encryption Library
 *
 * Menggunakan AES-256-GCM untuk encrypt/decrypt password Google Account.
 * Password perlu bisa di-decrypt untuk login ulang otomatis.
 *
 * IMPORTANT:
 * - Set ENCRYPTION_KEY di environment variable (32 bytes hex string)
 * - Jangan commit encryption key ke git
 * - Gunakan key yang berbeda untuk production
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes untuk AES
const AUTH_TAG_LENGTH = 16; // 16 bytes untuk GCM auth tag
const SALT_LENGTH = 64; // Salt untuk additional security

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY environment variable is not set");
    }
    // Key harus 32 bytes (64 hex characters) untuk AES-256
    if (key.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
    }
    return Buffer.from(key, "hex");
};

/**
 * Encrypt string menggunakan AES-256-GCM
 * @param text - Plain text yang akan di-encrypt
 * @returns Encrypted string dalam format: iv:authTag:salt:encryptedData (hex)
 */
export function encrypt(text: string): string {
    try {
        const key = getEncryptionKey();
        const iv = randomBytes(IV_LENGTH);
        const salt = randomBytes(SALT_LENGTH);

        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:salt:encryptedData
        return `${iv.toString("hex")}:${authTag.toString("hex")}:${salt.toString("hex")}:${encrypted}`;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
}

/**
 * Decrypt string yang di-encrypt dengan encrypt()
 * @param encryptedText - Encrypted string dalam format: iv:authTag:salt:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(":");

        if (parts.length !== 4) {
            throw new Error("Invalid encrypted text format");
        }

        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[3];

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}

/**
 * Generate encryption key baru (untuk setup awal)
 * Run: bun run generate-key
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString("hex");
}

// Script helper untuk generate key
if (import.meta.main) {
    console.log("🔑 Generated Encryption Key:");
    console.log(generateEncryptionKey());
    console.log("\n⚠️  Add this to your .env file:");
    console.log("ENCRYPTION_KEY=<key_above>");
}
