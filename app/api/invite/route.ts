import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createInvitationToken, sendInvitationEmail } from "@/lib/invitation"

export const runtime = "nodejs"

const schema = z.object({
  account_id: z.string().length(7),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["user", "admin", "super_admin"]).optional(),
})

export async function POST(req: Request) {
  try {
    // Check authentication using NextAuth's auth() function
    const session = await auth()
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You must be signed in to invite users." },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    const userRole = (session.user as any).role as string | undefined
    const userAccountId = (session.user as any).account_id as string | undefined

    // Get the current user
    const currentUser = await prisma.user.findUnique({ 
      where: { email: userEmail },
      select: { id: true, email: true, role: true, account_id: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User not found." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { account_id, email, role } = schema.parse(body)

    const normalizedEmail = email.trim().toLowerCase()

    // Ensure account exists
    const account = await prisma.account.findUnique({ where: { account_id } })
    if (!account) {
      return NextResponse.json(
        { error: "ACCOUNT_NOT_FOUND", message: "Account does not exist." },
        { status: 404 }
      )
    }

    // Check if user is an admin AND belongs to this account
    // Only admins/super-admins can invite users, and only to their own company
    if (!["admin", "super_admin"].includes(currentUser.role) || currentUser.account_id !== account_id) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only company admins can invite users to this company." },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json(
        { error: "USER_EXISTS", message: "A user with this email already exists." },
        { status: 409 }
      )
    }

    // Only super-admins can assign super_admin role
    if (role === "super_admin" && currentUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only super admins can assign super admin role." },
        { status: 403 }
      )
    }

    // Create invitation token
    const invitationToken = await createInvitationToken(normalizedEmail, account_id)
    
    // Send invitation email
    try {
      const inviteUrl = await sendInvitationEmail(normalizedEmail, invitationToken.token, account_id, account.company_name)
      
      return NextResponse.json({
        success: true,
        message: "Invitation sent successfully.",
        inviteUrl, // For testing - remove in production
      })
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const inviteUrl = `${baseUrl}/register?email=${encodeURIComponent(normalizedEmail)}&account_id=${account_id}&token=${invitationToken.token}`
      return NextResponse.json(
        {
          success: false,
          error: "EMAIL_DELIVERY_FAILED",
          message: "Invitation could not be emailed. Use the inviteUrl to share manually or fix SMTP.",
          inviteUrl,
          smtpConfigured: false,
        },
        { status: 502 },
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Invite user error:", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}
