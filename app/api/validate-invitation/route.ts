import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInvitationToken } from "@/lib/invitation"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const account_id = searchParams.get("account_id")
    const token = searchParams.get("token")

    if (!email || !account_id || !token) {
      return NextResponse.json(
        { valid: false, message: "Missing required parameters." },
        { status: 400 }
      )
    }

    // Validate the invitation token
    const invitationRecord = await validateInvitationToken(token, email, account_id)
    if (!invitationRecord) {
      return NextResponse.json(
        { valid: false, message: "Invalid or expired invitation link." },
        { status: 400 }
      )
    }

    // Verify the account exists
    const account = await prisma.account.findUnique({
      where: { account_id },
      select: { company_name: true, account_id: true },
    })

    if (!account) {
      return NextResponse.json(
        { valid: false, message: "Account not found." },
        { status: 404 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      return NextResponse.json(
        { valid: false, message: "A user with this email already exists." },
        { status: 409 }
      )
    }

    return NextResponse.json({
      valid: true,
      companyName: account.company_name,
      account_id: account.account_id,
    })
  } catch (error) {
    console.error("Validate invitation error:", error)
    return NextResponse.json(
      { valid: false, message: "Failed to validate invitation." },
      { status: 500 }
    )
  }
}

