import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM

let ACTIVE_KEY = null;

// Initialize and validate the key
const initializeKey = () => {
  const keyBase64 = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is missing from environment variables.");
  }
  
  const keyBuffer = Buffer.from(keyBase64, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must be exactly 32 bytes (decoded from Base64).");
  }

  ACTIVE_KEY = keyBuffer;
};

// Try to initialize immediately, will throw on import if invalid
try {
  initializeKey();
} catch (error) {
  console.error("FATAL: Failed to initialize message encryption.");
  console.error(error.message);
  process.exit(1);
}

/**
 * Encrypts a plaintext payload using AES-256-GCM.
 * @param {string} payload - The serialized plaintext to encrypt.
 * @returns {Object} { ciphertext, iv, authTag, keyVersion }
 */
export const encryptMessagePayload = (payload) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ACTIVE_KEY, iv);
    
    let ciphertext = cipher.update(payload, "utf8", "base64");
    ciphertext += cipher.final("base64");
    
    const authTag = cipher.getAuthTag().toString("base64");

    return {
      ciphertext,
      iv: iv.toString("base64"),
      authTag,
      keyVersion: 1 // Default active key version
    };
  } catch (error) {
    throw new Error("Encryption failed: " + error.message);
  }
};

/**
 * Decrypts a ciphertext payload using AES-256-GCM.
 * @param {string} ciphertext - Base64 encoded ciphertext.
 * @param {string} iv - Base64 encoded IV.
 * @param {string} authTag - Base64 encoded authentication tag.
 * @param {number} keyVersion - Version of the key used for encryption.
 * @returns {string} The decrypted plaintext.
 */
export const decryptMessagePayload = (ciphertext, iv, authTag, keyVersion) => {
  try {
    // Note: If we had key rotation, we would look up the key by keyVersion here.
    // For now, we only support keyVersion = 1.
    if (keyVersion !== 1) {
      throw new Error(`Unsupported keyVersion: ${keyVersion}`);
    }

    const ivBuffer = Buffer.from(iv, "base64");
    const authTagBuffer = Buffer.from(authTag, "base64");

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ACTIVE_KEY, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let plaintext = decipher.update(ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");

    return plaintext;
  } catch (error) {
    throw new Error("Decryption failed: " + error.message);
  }
};
