
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { createEmailVerificationToken, sendVerificationEmail, validateVerificationToken } from "@/lib/email-verification"
import { validateInvitationToken } from "@/lib/invitation"

// Disable Edge Runtime for this route
// This is needed because bcryptjs uses Node.js APIs not available in Edge Runtime
export const runtime = 'nodejs';

const blockedEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "pm.me",
])

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  account_id: z.string().length(7).optional(),
  companyName: z.string().min(2, "Company name is required").optional(),
  setupToken: z.string().optional(),
  invitationToken: z.string().optional(),
})

function isBusinessEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return false
  return !blockedEmailDomains.has(domain)
}

async function ensureAccount(accountId: string | undefined, companyName: string, email: string) {
  if (accountId) {
    const existing = await prisma.account.findUnique({ where: { account_id: accountId } })
    if (!existing) {
      throw new Error("ACCOUNT_NOT_FOUND")
    }
    return accountId
  }

  const domain = email.split("@")[1] || "company.com"
  const created = await prisma.account.create({
    data: {
      company_name: companyName,
      company_domain: domain,
      owner_email: email,
    },
  })
  const computedId = String(created.accountSeq).padStart(7, "0")
  const updated = await prisma.account.update({
    where: { accountSeq: created.accountSeq },
    data: { account_id: computedId },
    select: { account_id: true },
  })
  return updated.account_id!
}

export async function POST(req: Request) {
  try {
    console.log('Registration request received');
    let body;
    try {
      body = await req.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      );
    }

    try {
      const { email, password, name, role, account_id, companyName, setupToken, invitationToken } = schema.parse(body);
      const normalizedEmail = email.trim().toLowerCase();
      console.log('Validated input:', { email: normalizedEmail, name: name || 'not provided', hasInvitation: !!invitationToken });

      // Handle invitation-based registration
      if (invitationToken) {
        // Validate invitation token
        const invitationRecord = await validateInvitationToken(invitationToken, normalizedEmail)
        if (!invitationRecord) {
          return NextResponse.json(
            { error: "INVALID_INVITATION", message: "Invalid or expired invitation link." },
            { status: 400 },
          )
        }

        // Verify account_id matches
        if (!account_id) {
          return NextResponse.json(
            { error: "ACCOUNT_ID_REQUIRED", message: "Account ID is required for invitation registration." },
            { status: 400 },
          )
        }

        // Verify account exists
        const account = await prisma.account.findUnique({
          where: { account_id },
          select: { company_name: true },
        })

        if (!account) {
          return NextResponse.json(
            { error: "ACCOUNT_NOT_FOUND", message: "Account not found." },
            { status: 404 },
          )
        }

        // Check if user already exists
        const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (exists) {
          return NextResponse.json(
            { error: "Email already registered" }, 
            { status: 409 }
          );
        }

        // Validate required fields
        if (!name || !name.trim()) {
          return NextResponse.json(
            { error: "NAME_REQUIRED", message: "Full name is required." },
            { status: 400 },
          )
        }

        // Create user with invitation
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: name.trim(),
            passwordHash,
            role: role ?? "user",
            account_id,
            companyName: account.company_name,
            emailVerified: new Date(), // Email is pre-verified via invitation
          },
        })

        // Delete the invitation token
        await prisma.emailVerificationToken.deleteMany({ where: { token: invitationToken } })

        return NextResponse.json({
          id: user.id,
          email: user.email,
          message: 'Registration successful. You can sign in now.',
        })
      }

      // Handle regular registration (workspace creation)
      if (!isBusinessEmail(normalizedEmail)) {
        return NextResponse.json(
          { error: "BUSINESS_EMAIL_REQUIRED", message: "Please use your business email address (free providers are not allowed)." },
          { status: 400 },
        )
      }

      console.log('Checking if user exists...');
      const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (exists) {
        console.log('User already exists:', email);
        return NextResponse.json(
          { error: "Email already registered" }, 
          { status: 409 }
        );
      }

      console.log('Ensuring account...');
      let resolvedAccountId: string
      try {
        resolvedAccountId = await ensureAccount(account_id, companyName || "", normalizedEmail)
      } catch (accountError) {
        if ((accountError as Error).message === "ACCOUNT_NOT_FOUND") {
          return NextResponse.json(
            { error: "ACCOUNT_NOT_FOUND", message: "The provided account ID could not be found." },
            { status: 404 },
          )
        }
        throw accountError
      }

      if (account_id) {
        if (!setupToken) {
          return NextResponse.json(
            { error: "SETUP_TOKEN_REQUIRED", message: "Verification is required before creating the workspace password." },
            { status: 400 },
          )
        }
        const setupRecord = await validateVerificationToken(setupToken)
        if (!setupRecord || setupRecord.email !== normalizedEmail) {
          return NextResponse.json(
            { error: "INVALID_SETUP_TOKEN", message: "Your verification session has expired. Request a new code." },
            { status: 400 },
          )
        }
        await prisma.emailVerificationToken.deleteMany({ where: { token: setupToken } })
      }

      console.log('Hashing password...');
      const passwordHash = await bcrypt.hash(password, 10);

      const emailVerifiedAt = account_id ? new Date() : null;
      
      console.log('Creating user...');
      const user = await prisma.user.create({ 
        data: { 
          email: normalizedEmail, 
          name, 
          passwordHash,
          role: role ?? "user",
          account_id: resolvedAccountId,
          companyName: companyName || undefined,
          emailVerified: emailVerifiedAt ?? undefined,
        } 
      });
      
      console.log('User created:', user.id);

      if (!emailVerifiedAt) {
        const verification = await createEmailVerificationToken(normalizedEmail)
        await sendVerificationEmail(normalizedEmail, verification.token, companyName || undefined)
        console.log('Verification email queued:', { userId: user.id })
      }

      return NextResponse.json({ 
        id: user.id, 
        email: user.email,
        message: emailVerifiedAt
          ? 'Registration successful. You can sign in now.'
          : 'Registration successful. Please check your email to verify your account before signing in.'
      });

    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            details: validationError.errors 
          }, 
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error: unknown) {
    console.error('Server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = (error instanceof Error && process.env.NODE_ENV === 'development') 
      ? error.stack 
      : undefined;
      
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: errorStack
      }, 
      { status: 500 }
    );
  }
}
