"use client"

import { useState, useEffect, FormEvent, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PrimaryInput } from "../components/PrimaryInput"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (!token) {
      setFeedback({ type: "error", message: "Invalid reset link. Please request a new password reset." })
    }
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)

    if (!token) {
      setFeedback({ type: "error", message: "Invalid reset link." })
      return
    }

    if (password.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters." })
      return
    }

    if (password !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data.message || "Failed to reset password. Please try again."
        })
        return
      }

      setFeedback({
        type: "success",
        message: "Password reset successfully! Redirecting to login..."
      })

      setTimeout(() => {
        router.push("/")
      }, 2000)

    } catch (error) {
      console.error("Reset password error:", error)
      setFeedback({
        type: "error",
        message: "An error occurred. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0e6f69]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#5dd4ff]/20 blur-3xl" />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 shadow-[0_20px_45px_-25px_rgba(16,167,255,0.45)] sm:p-8">
          <h1 className="mb-2 text-2xl font-semibold text-white">Reset Password</h1>
          <p className="mb-6 text-sm text-blue-200">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <PrimaryInput
                type="password"
                size="lg"
                className="h-[44px]"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <PrimaryInput
                type="password"
                size="lg"
                className="h-[44px]"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {feedback && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="btn btn-primary w-full"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <Link href="/" className="text-center text-sm text-blue-200 hover:text-blue-100">
              Back to login
            </Link>
          </form>
        </div>
      </section>
    </main>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050915] via-[#060f24] to-[#030614] text-[#eef3ff]">
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-blue-200">Loading...</div>
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

