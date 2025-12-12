import crypto from "crypto"

export type VaultEntry = {
  id: string
  label: string
  username: string
  password: string
  url?: string
  notes?: string
  tags?: string[]
  favorite?: boolean
}

export type PersistedVault = {
  cipher: string
  iv: string
  salt: string
  lastUpdated: number
  entryCount: number
}

const ITERATIONS = 100_000
const KEYLEN = 32
const DIGEST = "sha256"

function deriveKey(secret: string, salt: Buffer) {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEYLEN, DIGEST)
}

export function encryptVault(entries: VaultEntry[], secret: string): PersistedVault {
  const salt = crypto.randomBytes(16)
  const key = deriveKey(secret, salt)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const plaintext = Buffer.from(JSON.stringify(entries), "utf8")
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const cipherWithTag = Buffer.concat([encrypted, tag])

  return {
    cipher: cipherWithTag.toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    lastUpdated: Date.now(),
    entryCount: entries.length,
  }
}

export function decryptVault(vault: PersistedVault, secret: string): VaultEntry[] {
  const salt = Buffer.from(vault.salt, "base64")
  const iv = Buffer.from(vault.iv, "base64")
  const cipherWithTag = Buffer.from(vault.cipher, "base64")
  const tag = cipherWithTag.subarray(cipherWithTag.length - 16)
  const encrypted = cipherWithTag.subarray(0, cipherWithTag.length - 16)

  const key = deriveKey(secret, salt)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  const json = decrypted.toString("utf8")
  const parsed = JSON.parse(json) as VaultEntry[]
  return parsed
}

