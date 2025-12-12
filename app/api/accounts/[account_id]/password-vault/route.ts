import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

import { decryptVault, encryptVault, type PersistedVault, type VaultEntry } from "@/lib/passwordVaultCrypto"

async function getAccountSeq(account_id: string) {
  const account = await prisma.account.findUnique({
    where: { account_id },
    select: { accountSeq: true },
  })
  return account?.accountSeq ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: { account_id: string } }
) {
  try {
    const url = new URL(_req.url)
    const key = url.searchParams.get("key") || undefined

    const accountSeq = await getAccountSeq(params.account_id)
    if (!accountSeq) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    const vault = await prisma.passwordVault.findFirst({
      where: { accountSeq },
      orderBy: { updatedAt: "desc" },
    })

    if (!vault) {
      return NextResponse.json({ vault: null, entries: [] })
    }

    const payload: PersistedVault = {
      cipher: vault.cipher,
      iv: vault.iv,
      salt: vault.salt,
      lastUpdated: Number(vault.lastUpdated),
      entryCount: vault.entryCount,
    }

    if (key) {
      try {
        const entries = decryptVault(payload, key)
        return NextResponse.json({ vault: payload, entries })
      } catch {
        return NextResponse.json({ error: "DECRYPT_FAILED" }, { status: 400 })
      }
    }

    // Plaintext mode: iv and salt empty -> cipher is JSON string of entries
    if (!payload.iv && !payload.salt) {
      try {
        const entries = JSON.parse(payload.cipher) as VaultEntry[]
        return NextResponse.json({ vault: payload, entries })
      } catch {
        return NextResponse.json({ vault: payload, entries: [] })
      }
    }

    return NextResponse.json({ vault: payload })
  } catch (err) {
    console.error("Fetch password vault error", err)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { account_id: string } }
) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      vault?: PersistedVault | null
      entries?: VaultEntry[]
      key?: string
    }

    const accountSeq = await getAccountSeq(params.account_id)
    if (!accountSeq) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 })
    }

    // Option A: entries + key => encrypt server-side
    if (Array.isArray(body.entries) && typeof body.key === "string" && body.key.trim()) {
      const vault = encryptVault(body.entries, body.key)
      await prisma.passwordVault.upsert({
        where: { accountSeq },
        create: {
          accountSeq,
          cipher: vault.cipher,
          iv: vault.iv,
          salt: vault.salt,
          lastUpdated: BigInt(vault.lastUpdated),
          entryCount: vault.entryCount,
        },
        update: {
          cipher: vault.cipher,
          iv: vault.iv,
          salt: vault.salt,
          lastUpdated: BigInt(vault.lastUpdated),
          entryCount: vault.entryCount,
        },
      })

      return NextResponse.json({ ok: true })
    }

    // Option B: entries plaintext (no key) -> store JSON in cipher, empty iv/salt
    if (Array.isArray(body.entries)) {
      const json = JSON.stringify(body.entries)
      await prisma.passwordVault.upsert({
        where: { accountSeq },
        create: {
          accountSeq,
          cipher: json,
          iv: "",
          salt: "",
          lastUpdated: BigInt(Date.now()),
          entryCount: body.entries.length,
        },
        update: {
          cipher: json,
          iv: "",
          salt: "",
          lastUpdated: BigInt(Date.now()),
          entryCount: body.entries.length,
        },
      })
      return NextResponse.json({ ok: true })
    }

    // Option C: raw vault payload (legacy)
    if (!("vault" in body)) {
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 })
    }

    const { vault } = body

    if (!vault) {
      await prisma.passwordVault.deleteMany({ where: { accountSeq } })
      return NextResponse.json({ ok: true })
    }

    if (
      !vault.cipher ||
      vault.iv === undefined ||
      vault.salt === undefined ||
      typeof vault.lastUpdated !== "number" ||
      typeof vault.entryCount !== "number"
    ) {
      return NextResponse.json({ error: "INVALID_VAULT" }, { status: 400 })
    }

    await prisma.passwordVault.upsert({
      where: { accountSeq },
      create: {
        accountSeq,
        cipher: vault.cipher,
        iv: vault.iv,
        salt: vault.salt,
        lastUpdated: BigInt(vault.lastUpdated),
        entryCount: vault.entryCount,
      },
      update: {
        cipher: vault.cipher,
        iv: vault.iv,
        salt: vault.salt,
        lastUpdated: BigInt(vault.lastUpdated),
        entryCount: vault.entryCount,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Persist password vault error", err)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}



