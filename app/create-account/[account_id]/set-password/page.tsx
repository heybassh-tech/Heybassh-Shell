"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

type Feedback = { type: "success" | "error" | "info"; message: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SetPasswordPage({ params }: { params: { account_id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetEmail = searchParams.get("email")?.toLowerCase() ?? ""
  const companyLabel = searchParams.get("company") ?? `Workspace ${params.account_id}`
  const setupToken = searchParams.get("verification") ?? ""

  const [email, setEmail] = useState(presetEmail)
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const heading = useMemo(
    () => `Secure ${companyLabel}`,
    [companyLabel],
  )

  function validate(): boolean {
    const nextEmail = email.trim().toLowerCase()
    if (!nextEmail || !emailPattern.test(nextEmail)) {
      setFeedback({ type: "error", message: "Enter a valid work email." })
      return false
    }
    if (!fullName.trim()) {
      setFeedback({ type: "error", message: "Enter the primary contact's full name." })
      return false
    }
    if (password.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters." })
      return false
    }
    if (password !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." })
      return false
    }
    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    if (!validate()) return

    if (!setupToken) {
      setFeedback({ type: "error", message: "Verification required. Please request a new setup code." })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setSubmitting(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: fullName.trim(),
          account_id: params.account_id,
          role: "admin",
          companyName: companyLabel,
          setupToken,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          data?.error === "Email already registered"
            ? "This email already has access. Try signing in instead."
            : data?.error || "Unable to secure the workspace right now."
        setFeedback({ type: "error", message })
        return
      }

      setFeedback({ type: "success", message: "Workspace secured. Signing you in…" })

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      })

      if (result?.ok) {
        router.replace(`/${params.account_id}/dashboard`)
        return
      }

      if (result?.error) {
        setFeedback({
          type: "info",
          message: "Account created, but automatic sign-in failed. Please sign in manually.",
        })
      }

      router.push(`/?account_id=${params.account_id}`)
    } catch (error) {
      console.error("Set password error:", error)
      setFeedback({
        type: "error",
        message: "Unexpected error. Please try again in a moment.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030615] text-white flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0b132c] p-6 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/70">Step 2 of 2</p>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-blue-200">
          {setupToken
            ? "Demo verification complete. Create the primary password so your team can log in to Heybassh Business Suite."
            : "Your verification session has expired. Request a new code to continue."}
        </p> 

        <div className="space-y-2">
          <label className="text-sm text-blue-100">Work email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-[#1a2446] bg-[#050b1f] p-3 text-sm focus:border-[#0e6f69] focus:outline-none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            readOnly={Boolean(presetEmail)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-blue-100">Full name</label>
          <input
            type="text"
            className="w-full rounded-xl border border-[#1a2446] bg-[#050b1f] p-3 text-sm focus:border-[#0e6f69] focus:outline-none"
            placeholder="Primary contact"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-blue-100">Create password</label>
          <input
            type="password"
            className="w-full rounded-xl border border-[#1a2446] bg-[#050b1f] p-3 text-sm focus:border-[#0e6f69] focus:outline-none"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-blue-100">Confirm password</label>
          <input
            type="password"
            className="w-full rounded-xl border border-[#1a2446] bg-[#050b1f] p-3 text-sm focus:border-[#0e6f69] focus:outline-none"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        {feedback && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-500/10 text-green-200"
                : feedback.type === "info"
                  ? "bg-blue-500/10 text-blue-100"
                  : "bg-red-500/10 text-red-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !setupToken}
          className="btn btn-primary w-full justify-center rounded-2xl py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Create password & continue"}
        </button>

        <p className="text-center text-xs text-blue-200/70">
          Already created a password?{" "}
          <Link href="/" className="text-[#5dd4ff] underline-offset-4 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  )
}

