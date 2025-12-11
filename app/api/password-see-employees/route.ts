import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptPassword } from "@/lib/password-encryption";

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
        encryptedPassword: true,
        emailVerified: true,
        createdAt: true,
        companyName: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Decrypt passwords for super admin viewing
    const usersWithPasswords = allUsers.map((user) => {
      let password = "N/A";
      if (user.encryptedPassword) {
        try {
          password = decryptPassword(user.encryptedPassword);
        } catch (error) {
          console.error(`Failed to decrypt password for user ${user.email}:`, error);
          password = "Decryption failed";
        }
      } else {
        password = "Not encrypted (old user)";
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        account_id: user.account_id,
        password: password,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        companyName: user.companyName,
      };
    });

    return NextResponse.json({
      users: usersWithPasswords,
      note: "Passwords are encrypted and can be viewed by super admins only. Users created before encryption was implemented will show 'Not encrypted (old user)'.",
    });
  } catch (error) {
    console.error("[password-see-employees] Error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to load users." },
      { status: 500 }
    );
  }
}
