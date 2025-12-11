
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const runtime = "nodejs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (creds) => {
        try {
          if (!creds?.email) {
            return null
          }

          const email = creds.email as string
          const normalizedEmail = email.trim().toLowerCase()

          // Validate schema for other accounts
          const parsed = z.object({
            email: z.string().email(),
            password: z.string().min(1)
          }).safeParse(creds)
          
          if (!parsed.success) {
            return null
          }
          
          const { password } = parsed.data

          // Check if user exists
          const user = await prisma.user.findUnique({ 
            where: { email: normalizedEmail },
            select: { id: true, email: true, name: true, passwordHash: true, role: true, account_id: true, emailVerified: true, companyName: true }
          })
          
          if (!user) {
            return null
          }

          // Ensure account owner is always super_admin
          let effectiveRole = user.role
          if (user.account_id) {
            const account = await prisma.account.findUnique({
              where: { account_id: user.account_id },
              select: { owner_email: true },
            })
            if (account && account.owner_email.toLowerCase() === user.email.toLowerCase() && user.role !== "super_admin") {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: "super_admin" },
              })
              effectiveRole = "super_admin"
            }
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.passwordHash)
          
          if (!passwordMatch) {
            return null
          }

          if (!user.emailVerified) {
            if (user.account_id) {
              await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() }
              })
            } else {
              return null
            }
          }

          // Credentials are valid
          return { id: user.id, email: user.email, name: user.name ?? user.email, role: effectiveRole, account_id: user.account_id, companyName: user.companyName }
        } catch (err) {
          console.error("Credentials authorize error:", err)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as typeof user & {
          id: string
          email: string
          name?: string | null
          role?: string
          account_id?: string | null
          companyName?: string | null
        }

        token.user = {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name ?? authenticatedUser.email,
          role: authenticatedUser.role,
          account_id: authenticatedUser.account_id,
          companyName: authenticatedUser.companyName,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.user) {
        const tokenUser = token.user as {
          id: string
          email: string
          name?: string | null
          role?: string
          account_id?: string | null
          companyName?: string | null
        }

        session.user = {
          ...session.user,
          id: tokenUser.id,
          email: tokenUser.email,
          name: tokenUser.name ?? tokenUser.email,
          role: tokenUser.role,
          account_id: tokenUser.account_id,
          companyName: tokenUser.companyName,
          emailVerified: null,
        } as typeof session.user & {
          id: string
          email: string
          name?: string | null
          role?: string
          account_id?: string | null
          companyName?: string | null
        }
      }
      return session
    }
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
})
