import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getToken } from "next-auth/jwt"
import { createInvitationToken, sendInvitationEmail } from "@/lib/invitation"

export const runtime = "nodejs"

const schema = z.object({
  account_id: z.string().length(7),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
})

export async function POST(req: Request) {
  try {
    // Check authentication
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!authSecret || typeof authSecret !== 'string') {
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Authentication configuration error." },
        { status: 500 }
      )
    }
    
    const token = await getToken({ 
      req, 
      secret: authSecret as string
    })
    
    if (!token || !token.user || !(token.user as any).email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You must be signed in to invite users." },
        { status: 401 }
      )
    }

    const userEmail = (token.user as any).email as string
    const userRole = (token.user as any).role as string
    const userAccountId = (token.user as any).account_id as string

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
    const { account_id, email } = schema.parse(body)

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
    // Only admins can invite users, and only to their own company
    if (currentUser.role !== "admin" || currentUser.account_id !== account_id) {
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
      // Still return success with the URL for testing
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const inviteUrl = `${baseUrl}/register?email=${encodeURIComponent(normalizedEmail)}&account_id=${account_id}&token=${invitationToken.token}`
      return NextResponse.json({
        success: true,
        message: "Invitation created but email sending failed. Use the inviteUrl to share with the user.",
        inviteUrl,
        smtpConfigured: false,
      })
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
