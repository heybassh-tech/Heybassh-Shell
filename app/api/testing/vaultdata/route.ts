import { NextResponse } from "next/server"

export const runtime = "nodejs"

type VaultEntry = {
  id: string
  label: string
  username: string
  password: string
  url?: string
  notes?: string
  tags?: string[]
  favorite?: boolean
}

// Simple in-memory store for demo/testing purposes
const vaultEntries: VaultEntry[] = [
  {
    id: "vault-seed",
    favorite: true,
    label: "dfsdfwe",
    notes: "dfdfsd",
    password: "z%#mTTdEuLvvzEQnSg",
    tags: ["Production", "Internal"],
    url: "https://quran411.com",
    username: "wew@gmail.com",
  },
]

function normalizePayload(body: Partial<VaultEntry>): VaultEntry | null {
  if (!body.label || !body.username || !body.password) {
    return null
  }

  return {
    id: body.id ?? `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: String(body.label),
    username: String(body.username),
    password: String(body.password),
    url: body.url ? String(body.url) : "",
    notes: body.notes ? String(body.notes) : "",
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    favorite: Boolean(body.favorite),
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, data: vaultEntries })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<VaultEntry>
  const entry = normalizePayload(body)

  if (!entry) {
    return NextResponse.json({ error: "Missing required fields (label, username, password)" }, { status: 400 })
  }

  const existingIndex = vaultEntries.findIndex((item) => item.id === entry.id)
  if (existingIndex >= 0) {
    vaultEntries[existingIndex] = entry
  } else {
    vaultEntries.unshift(entry)
  }

  return NextResponse.json({ ok: true, data: entry })
}


