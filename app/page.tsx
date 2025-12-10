"use client"

import { signIn } from "next-auth/react"
import { FormEvent, useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import logo from "../Images/heybasshlogo.png"
import { PrimaryButton } from "./components/PrimaryButton"
import { PrimaryInput } from "./components/PrimaryInput"

type Feedback = { type: "success" | "error" | "info"; message: string }

export default function Page() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  )
}
type FormErrors = Partial<Record<"email" | "password" | "name" | "companyName", string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
  "aol.com",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "mail.com",
  "zoho.com",
])

function HomeInner() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  function resetUi() {
    setFormErrors({})
    setFeedback(null)
    setForgotStatus("idle")
  }

  function validateForm() {
    const errors: FormErrors = {}
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) errors.email = "Email is required."
    else if (!emailPattern.test(trimmedEmail)) errors.email = "Enter a valid email address."

    if (!trimmedPassword) errors.password = "Password is required."

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onLogin() {
    if (!validateForm()) return
    setLoading(true)
    setFeedback(null)
    setForgotStatus("idle")
    try {
      const trimmedEmail = email.trim().toLowerCase()
      // For other accounts, validate with our custom endpoint for specific error messages
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Show specific error message based on error type
        let errorMessage = "Unable to sign in. Please try again."
        
        if (data.error === "EMAIL_NOT_FOUND") {
          errorMessage = "No account found with this email address. Please check your email or create a new account."
        } else if (data.error === "INVALID_PASSWORD") {
          errorMessage = "The password you entered is incorrect. Please try again or use 'Forgot password?' to reset it."
        } else if (data.error === "VALIDATION_ERROR") {
          errorMessage = "Please enter a valid email address and password."
        } else if (data.error === "EMAIL_NOT_VERIFIED") {
          errorMessage = "Please verify your email address before signing in. Check your inbox for the confirmation link."
        } else if (data.message) {
          errorMessage = data.message
        }
        
        setFeedback({ type: "error", message: errorMessage })
        return
      }

      // If validation passed, create the session with NextAuth
      const result = await signIn("credentials", { 
        email: email.trim(), 
        password: password.trim(), 
        redirect: false 
      })
      
      if (result?.ok) {
        setFeedback({ type: "success", message: "Signed in successfully. Redirecting..." })
        setTimeout(async () => {
          try {
            const sRes = await fetch("/api/auth/session")
            const s = sRes.ok ? await sRes.json() : null
            const accId = s?.user?.account_id
            if (accId) {
              window.location.href = `/${accId}/dashboard`
            } else {
              window.location.href = "/dashboard" // middleware will normalize
            }
          } catch {
            window.location.href = "/dashboard"
          }
        }, 500)
        return
      }
      
      setFeedback({
        type: "error",
        message: "Authentication failed. Please try again.",
      })
    } catch (error) {
      console.error("Login error:", error)
      setFeedback({ 
        type: "error", 
        message: "Unable to sign in right now. Please try again shortly." 
      })
    } finally {
      setLoading(false)
    }
  }

  async function onForgotPassword() {
    if (forgotStatus === "sending") return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setFeedback({ type: "error", message: "Enter your email so we know where to send the reset link." })
      return
    }
    if (!emailPattern.test(trimmedEmail)) {
      setFeedback({ type: "error", message: "Enter a valid email address before requesting a reset." })
      return
    }
    setForgotStatus("sending")
    setFeedback(null)
    console.log("📧 [CLIENT] Sending password reset request for:", trimmedEmail)
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const data = await response.json()
      console.log("📧 [CLIENT] Response received:", data)

      if (!response.ok || !data.success) {
        console.error("[CLIENT] Email sending failed:", data)
        if (data.errorDetails) {
          console.error("[CLIENT] Detailed email error:", data.errorDetails)
        }
        
        // Special handling for SMTP not configured - show reset URL
        if (data.smtpConfigured === false && data.resetUrl) {
          setFeedback({
            type: "error",
            message: `Email service is not configured. Click here to reset your password: ${data.resetUrl}`
          })
          setForgotStatus("idle")
          return
        }
        
        setFeedback({
          type: "error",
          message: data.message || "Failed to send reset email. Please try again."
        })
        setForgotStatus("idle")
        return
      }

      if (data.emailSent) {
        console.log("[CLIENT] Email sent successfully!")
        setForgotStatus("sent")
        setFeedback({
          type: "success",
          message: data.message || `Password reset email has been sent successfully to ${trimmedEmail}. Please check your inbox (and spam folder).`
        })
      } else {
        console.log("[CLIENT] User not found or email not sent")
        setForgotStatus("sent")
        setFeedback({
          type: "info",
          message: data.message || "If an account exists with this email, a password reset link has been sent. Please check your inbox."
        })
      }
    } catch (error) {
      console.error("[CLIENT] Forgot password error:", error)
      setFeedback({
        type: "error",
        message: "Unable to send reset email. Please check your connection and try again."
      })
      setForgotStatus("idle")
    } finally {
      setTimeout(() => setForgotStatus("idle"), 10000)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    onLogin()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#3ab0ff]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#5dd4ff]/20 blur-3xl" />
      </div>

      {/* Top-right toast container for auth feedback */}
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
              <div className="flex-1">
                {feedback.message.includes("https://") ? (
                  <span>
                    {feedback.message.split("https://")[0]}
                    <a
                      href={feedback.message.match(/https:\/\/[^\s]+/)?.[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-200 underline underline-offset-2 break-all"
                    >
                      {feedback.message.match(/https:\/\/[^\s]+/)?.[0]}
                    </a>
                  </span>
                ) : (
                  feedback.message
                )}
              </div>
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
        <div className="w-full max-w-5xl space-y-4">
          <div className="grid w-full gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <h1 className="text-3xl font-semibold leading-snug text-white md:text-4xl">
                Heybassh Shell Cloud
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-blue-100/90 md:text-xl">
                Secure access to your developer workspace, from anywhere.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-blue-100/80 md:text-base">
                Sign in to continue to your cloud shell environment or create a new account in just a few clicks. Enterprise-grade security, tailored for modern teams.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_20px_45px_-25px_rgba(16,167,255,0.45)] sm:p-8 min-h-[560px] md:min-h-[600px]">
            <div>
              <h2 className="text-xl font-semibold text-white md:text-2xl">
                Welcome back
              </h2>
            </div>

            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="block text-sm font-medium text-blue-200" htmlFor="email">
                  Email address
                </label>
                <div className="flex gap-2">
                  <input
                    id="email"
                    type="email"
                    className={`flex-1 rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-200 placeholder:text-xs placeholder:text-blue-300/60 focus:border-[#2b9bff] focus:outline-none ${formErrors.email ? "ring-2 ring-rose-400/70" : ""}`}
                    placeholder="name@company.com"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(formErrors.email)}
                  />
                </div>
                {formErrors.email && <p className="text-xs font-medium text-rose-300">{formErrors.email}</p>}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-blue-200" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="radius-6 px-2 py-1 text-xs font-medium text-[#5dd4ff] transition hover:text-white"
                    onClick={onForgotPassword}
                    disabled={forgotStatus === "sending"}
                  >
                    {forgotStatus === "sent" ? "Reset link sent" : "Forgot password?"}
                  </button>
                </div>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 pr-12 text-sm text-blue-200 placeholder:text-xs placeholder:text-blue-300/60 focus:border-[#2b9bff] focus:outline-none ${formErrors.password ? "ring-2 ring-rose-400/70" : ""}`}
                    placeholder="Your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(formErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="radius-6 absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-blue-300 transition-colors hover:text-white focus:outline-none z-10"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015 12c0 1.657.338 3.23.94 4.66M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.password && <p className="text-xs font-medium text-rose-300">{formErrors.password}</p>}
              </div>

              <PrimaryButton type="submit" disabled={loading} aria-busy={loading} className="w-full" size="lg">
                {loading ? <span className="spinner" role="status" aria-label="Processing request" /> : <span>Sign in</span>}
              </PrimaryButton>
            </form>

            <p className="text-xs text-blue-200/70 text-center">
              Need a full company workspace?{" "}
              <Link href="/create-account" className="text-[#5dd4ff] underline-offset-4 hover:underline">
                Create your free account →
              </Link>
            </p>

            {/* <p className="text-xs text-blue-200/60">
              By continuing, you agree to the Heybassh Shell Terms and acknowledge the Privacy Policy. Need assistance?{" "}
              <a
                className="font-medium text-[#5dd4ff] underline-offset-4 hover:underline"
                href="mailto:support@heybassh.com?subject=Heybassh%20Shell%20Support"
              >
                Contact support
              </a>
              .
            </p> */}

            <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                className="radius-6 inline-flex items-center gap-2 bg-black/60 px-2 py-1 text-xs text-blue-100 transition hover:bg-black/70"
                aria-label="Heybassh"
              >
                <span className="inline-flex items-center rounded bg-black p-1">
                  <Image src={logo} alt="Heybassh" height={18} className="w-auto h-[18px]" />
                </span>
                <span>Heybassh</span>
              </button>
              <a href="/" className="text-xs text-blue-200 hover:text-blue-100">Privacy policy</a>
            </div>
          </div>
          </div>
        </div>
      </section>
    </main>
  )
}
