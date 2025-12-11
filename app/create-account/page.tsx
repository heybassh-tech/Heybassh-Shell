"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PrimaryButton } from "../components/PrimaryButton"
import { PrimaryInput } from "../components/PrimaryInput"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const blockedPublicDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "protonmail.com",
])

function isBlockedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  return domain ? blockedPublicDomains.has(domain) : true
}

function deriveCompany(email: string) {
  const domainPart = email.split("@")[1]?.toLowerCase() || "example.com"
  const root = domainPart.split(".")[0] || "company"
  const company_name = root
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Company"
  return {
    company_name,
    company_domain: domainPart,
  }
}

export default function CreateAccountPage() {
  const router = useRouter()
  const [ownerEmail, setOwnerEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [normalizedEmail, setNormalizedEmail] = useState<string | null>(null)

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus(null)
    const trimmedEmail = ownerEmail.trim().toLowerCase()
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      setError("Enter a valid email address")
      return
    }
    if (isBlockedDomain(trimmedEmail)) {
      setError("Please use your work email address")
      return
    }
    setLoading(true)
    const { company_name, company_domain } = deriveCompany(trimmedEmail)
    try {
      const res = await fetch("/api/create-account/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          company_name,
          company_domain,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Failed to send verification code")
        setStatus(null)
        return
      }
      setOtpSent(true)
      setOtpCode("")
      setAccountId(data.account_id)
      setCompanyName(data.company_name ?? company_name)
      setNormalizedEmail(trimmedEmail)
      setStatus(data.message || `Verification code sent to ${trimmedEmail}.`)
    } catch (err: any) {
      console.error("Request OTP error:", err)
      setError("Unexpected error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!otpSent || !accountId || !normalizedEmail) {
      setError("Request a verification code first.")
      return
    }
    if (otpCode.trim().length < 4) {
      setError("Enter the 6-digit verification code.")
      return
    }
    setError(null)
    setStatus(null)
    setVerifyingOtp(true)
    try {
      const res = await fetch("/api/create-account/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          code: otpCode.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.error === "INVALID_CODE" ? "Incorrect or expired code. Try again." : data?.error || "Unable to verify code.")
        return
      }
      const query = new URLSearchParams({
        email: normalizedEmail,
        company: companyName ?? "Workspace",
      }).toString()
      if (!data?.setupToken) {
        setError("Verification succeeded but we could not start the setup session. Please request a new code.")
        return
      }
      router.push(`/create-account/${accountId}/set-password?${query}&verification=${encodeURIComponent(data.setupToken)}`)
    } catch (err: any) {
      console.error("Verify OTP error:", err)
      setError("Unexpected error. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0e6f69]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#5dd4ff]/20 blur-3xl" />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-5xl grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100">
              Workspace creation • Secure onboarding
            </p>
            <h1 className="text-3xl font-semibold leading-snug text-white md:text-4xl">
              Create your company workspace
            </h1>
            <p className="text-base text-blue-100/90 leading-relaxed">
              Use your work email to start your workspace. We’ll send a quick verification code to confirm you own the domain.
            </p>
            <ul className="space-y-2 text-sm text-blue-100/80">
              <li>• Super admin access for the creator</li>
              <li>• Invite teammates securely</li>
              <li>• No credit card required</li>
            </ul>
          </div>

          <div className="w-full space-y-5 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Verify your work email</h2>
              <p className="text-sm text-blue-200/80">
                We’ll send a 6-digit code to confirm ownership. Public email domains are blocked for security.
              </p>
            </div>

            <form onSubmit={onRequestCode} className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">Work email</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <PrimaryInput
                      type="email"
                      placeholder="you@company.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      required
                      size="md"
                    />
                  </div>
                  <PrimaryButton type="submit" disabled={loading} className="whitespace-nowrap px-5">
                    {loading ? "Sending…" : otpSent ? "Resend code" : "Send code"}
                  </PrimaryButton>
                </div>
              </div>
            </form>

            {otpSent && (
              <form onSubmit={onVerifyCode} className="space-y-3 border-t border-white/10 pt-4">
                <label className="block text-sm font-medium text-blue-200">Enter the 6-digit verification code</label>
                <PrimaryInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="text-center tracking-[0.4em] text-lg"
                  placeholder="______"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={verifyingOtp}
                  required
                  size="lg"
                />
                <PrimaryButton
                  type="submit"
                  disabled={verifyingOtp || otpCode.length < 4}
                  className="w-full"
                >
                  {verifyingOtp ? "Verifying…" : "Confirm code"}
                </PrimaryButton>
              </form>
            )}

            {(status || error) && (
              <div className="space-y-2">
                {status && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{status}</div>}
                {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
              </div>
            )}

            <p className="text-[11px] text-blue-200/60">
              By creating a workspace, you agree to receive service emails about your setup. You can manage invites once you’re inside.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
