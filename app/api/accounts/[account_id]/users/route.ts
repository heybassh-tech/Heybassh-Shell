import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const runtime = "nodejs"

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).optional()
})

export async function GET(_req: Request, { params }: { params: { account_id: string } }) {
  try {
    const users = await prisma.user.findMany({
      where: { account_id: params.account_id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        account_id: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[users][GET]", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { account_id: string } }) {
  try {
    const body = await req.json()
    const { email, name, password, role } = schema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 })
    }

    // Create user linked to account_id (7-digit)
    const bcrypt = await import("bcryptjs")
    const passwordHash = await bcrypt.default.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        role: role ?? "user",
        account_id: params.account_id
      },
      select: { id: true, email: true, name: true, role: true, account_id: true }
    })

    return NextResponse.json(user)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: err.errors }, { status: 400 })
    }
    console.error("Create user error", err)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}
