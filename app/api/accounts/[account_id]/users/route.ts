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
    // Get all registered users for this account
    const registeredUsers = await prisma.user.findMany({
      where: { account_id: params.account_id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        account_id: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Get all pending invitations (EmailVerificationTokens that haven't expired and don't have a user yet)
    const allInvitations = await prisma.emailVerificationToken.findMany({
      where: {
        expires: { gt: new Date() }, // Not expired
      },
      select: {
        email: true,
        createdAt: true,
      },
    })

    // Filter invitations to only those where:
    // 1. The email doesn't exist as a registered user
    // 2. We need to check if they're for this account - since EmailVerificationToken doesn't have account_id,
    //    we'll include all pending invitations for emails that don't have users yet
    //    (Note: This is a limitation - ideally we'd store account_id in EmailVerificationToken)
    const registeredEmails = new Set(registeredUsers.map(u => u.email.toLowerCase()))
    const pendingInvitations = allInvitations.filter(inv => !registeredEmails.has(inv.email.toLowerCase()))

    // Combine registered users and pending invitations
    const result = [
      // Registered users
      ...registeredUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        account_id: user.account_id,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        status: user.emailVerified ? "Active" : "Pending",
        userType: user.role === "admin" ? "Employee" : "Others",
      })),
      // Pending invitations
      ...pendingInvitations.map(inv => ({
        id: `inv-${inv.email}`, // Temporary ID for pending invitations
        email: inv.email,
        name: null,
        role: "user", // Default role, will be set when they register
        account_id: params.account_id,
        emailVerified: null,
        createdAt: inv.createdAt.toISOString(),
        status: "Pending",
        userType: "Others", // Default, we don't know the type until they register
      })),
    ]

    // Sort by createdAt descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(result)
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
