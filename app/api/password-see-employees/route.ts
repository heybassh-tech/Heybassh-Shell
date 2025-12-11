import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You must be signed in to access this page." },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true, account_id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User not found." },
        { status: 401 }
      );
    }

    // Only super admins can access this page
    if (currentUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only super admins can access this page." },
        { status: 403 }
      );
    }

    // Get all users across all accounts
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        account_id: true,
        passwordHash: true, // Include hash to show it exists
        emailVerified: true,
        createdAt: true,
        companyName: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Return users with password hash (but note that actual passwords cannot be retrieved)
    return NextResponse.json({
      users: allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        account_id: user.account_id,
        passwordHash: user.passwordHash, // Show full hash (but cannot be decrypted)
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        companyName: user.companyName,
      })),
      note: "Passwords are stored as bcrypt hashes (one-way encryption). Original passwords cannot be retrieved or decrypted. This is a security feature. If you need to view actual passwords, the system would need to be modified to store encrypted passwords in addition to hashed passwords.",
    });
  } catch (error) {
    console.error("[password-see-employees] Error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to load users." },
      { status: 500 }
    );
  }
}
