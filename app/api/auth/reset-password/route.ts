import { NextResponse } from 'next/server';
import { validateResetToken } from '@/lib/reset-tokens';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate the token
    const resetToken = await validateResetToken(token);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Encrypt password for admin viewing
    const { encryptPassword } = await import("@/lib/password-encryption");
    const encryptedPassword = encryptPassword(password);

    // Update the user's password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { 
        passwordHash: hashedPassword,
        encryptedPassword 
      },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
