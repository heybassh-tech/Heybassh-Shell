"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import logo from "../../Images/heybasshlogo.png"
import { PrimaryButton } from "../components/PrimaryButton"
import { PrimaryInput } from "../components/PrimaryInput"

type Feedback = { type: "success" | "error" | "info"; message: string }
type FormErrors = Partial<Record<"firstName" | "lastName" | "password", string>>

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [accountId, setAccountId] = useState("")
  const [token, setToken] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const accountIdParam = searchParams.get("account_id")
    const tokenParam = searchParams.get("token")

    if (!emailParam || !accountIdParam || !tokenParam) {
      setFeedback({ type: "error", message: "Invalid invitation link. Please check your email for the correct link." })
      setIsValidating(false)
      return
    }

    // Store validated values
    const validatedEmail = emailParam
    const validatedAccountId = accountIdParam
    const validatedToken = tokenParam

    setEmail(validatedEmail)
    setAccountId(validatedAccountId)
    setToken(validatedToken)

    // Validate invitation token and fetch company name
    async function validateInvitation() {
      try {
        const response = await fetch(`/api/validate-invitation?email=${encodeURIComponent(validatedEmail)}&account_id=${validatedAccountId}&token=${encodeURIComponent(validatedToken)}`)
        const data = await response.json()
        
        if (!response.ok || !data.valid) {
          setFeedback({ type: "error", message: data.message || "This invitation link is invalid or has expired." })
          setIsValidating(false)
          return
        }

        setCompanyName(data.companyName || "")
        setIsValidating(false)
      } catch (error) {
        console.error("Failed to validate invitation:", error)
        setFeedback({ type: "error", message: "Failed to validate invitation. Please try again." })
        setIsValidating(false)
      }
    }

    validateInvitation()
  }, [searchParams])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

function validateForm() {
    const errors: FormErrors = {}
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedPassword = password.trim()

    if (!trimmedFirst) errors.firstName = "First name is required."
    else if (trimmedFirst.length < 2) errors.firstName = "First name should be at least 2 characters."

    if (!trimmedLast) errors.lastName = "Last name is required."
    else if (trimmedLast.length < 2) errors.lastName = "Last name should be at least 2 characters."

    if (!trimmedPassword) errors.password = "Password is required."
    else if (trimmedPassword.length < 6) errors.password = "Use at least 6 characters."

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
    if (!validateForm() || !email || !accountId || !token) return

    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          account_id: accountId,
          companyName: companyName,
          invitationToken: token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFeedback({ type: "error", message: data.message || data.error || "Registration failed. Please try again." })
        return
      }

      setFeedback({ type: "success", message: "Account created successfully! Redirecting to sign in..." })
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Registration error:", error)
      setFeedback({ type: "error", message: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  if (isValidating) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-blue-200">Validating invitation...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#3ab0ff]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#5dd4ff]/20 blur-3xl" />
      </div>

      {/* Top-right toast container */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-md flex-col gap-3">
        {feedback && (
          <div
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md ${
              feedback.type === "success"
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                : feedback.type === "error"
                ? "border-rose-500/60 bg-rose-500/15 text-rose-100"
                : "border-blue-400/50 bg-blue-500/10 text-blue-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-current" />
              <div className="flex-1">{feedback.message}</div>
              <button
                type="button"
                className="ml-2 text-xs text-blue-200/80 hover:text-white"
                onClick={() => setFeedback(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-2xl font-semibold text-white mb-2">Create Your Account</h2>
            <p className="text-sm text-blue-200/70 mb-6">You've been invited to join {companyName}</p>

            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="grid gap-2">
                <label className="block text-sm font-medium text-blue-200" htmlFor="email">
                  Email
                </label>
                <PrimaryInput
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-[#0e1629]/50 text-blue-300/70"
                />
                <p className="text-xs text-blue-300/60">This email is linked to your invitation</p>
              </div>

              <div className="grid gap-2">
                <label className="block text-sm font-medium text-blue-200" htmlFor="first-name">
                  First name
                </label>
                <PrimaryInput
                  id="first-name"
                  type="text"
                  required
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={formErrors.firstName ? "ring-2 ring-rose-400/70" : ""}
                />
                {formErrors.firstName && <p className="text-xs font-medium text-rose-300">{formErrors.firstName}</p>}
              </div>

              <div className="grid gap-2">
                <label className="block text-sm font-medium text-blue-200" htmlFor="last-name">
                  Last name
                </label>
                <PrimaryInput
                  id="last-name"
                  type="text"
                  required
                  placeholder="Developer"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={formErrors.lastName ? "ring-2 ring-rose-400/70" : ""}
                />
                {formErrors.lastName && <p className="text-xs font-medium text-rose-300">{formErrors.lastName}</p>}
              </div>

              <div className="grid gap-2">
                <label className="block text-sm font-medium text-blue-200" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <PrimaryInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pr-12 ${formErrors.password ? "ring-2 ring-rose-400/70" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015 12c0 1.657.338 3.23.94 4.66M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.password && <p className="text-xs font-medium text-rose-300">{formErrors.password}</p>}
              </div>

              <PrimaryButton type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? <span className="spinner" role="status" /> : <span>Create Account</span>}
              </PrimaryButton>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-black/60 px-2 py-1 text-xs text-blue-100"
                aria-label="Heybassh"
              >
                <span className="inline-flex items-center rounded bg-black p-1">
                  <Image src={logo} alt="Heybassh" height={18} className="w-auto h-[18px]" />
                </span>
                <span>Heybassh</span>
              </button>
              <a href="/" className="text-xs text-blue-200 hover:text-blue-100">Back to Sign In</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-blue-200">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  )
}

