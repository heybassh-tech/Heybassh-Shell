import { NextResponse } from "next/server"
import { auth } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: { account_id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, account_id: true },
    })

    if (!currentUser || currentUser.account_id !== params.account_id) {
      return NextResponse.json({ isAdmin: false, error: "FORBIDDEN" }, { status: 403 })
    }

    const isAdmin = ["admin", "super_admin"].includes(currentUser.role ?? "user")
    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false, error: "FORBIDDEN" }, { status: 403 })
    }

    return NextResponse.json({ isAdmin: true })
  } catch (err) {
    console.error("[admin-check] unexpected error", err)
    return NextResponse.json({ isAdmin: false, error: "SERVER_ERROR" }, { status: 500 })
  }
}

