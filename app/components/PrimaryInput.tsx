import { forwardRef, InputHTMLAttributes } from "react"

type PrimaryInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "md" | "lg"
}

const sizeToPadding: Record<NonNullable<PrimaryInputProps["size"]>, string> = {
  sm: "py-2",
  md: "py-2.5",
  lg: "py-3",
}

export const PrimaryInput = forwardRef<HTMLInputElement, PrimaryInputProps>(function PrimaryInput(
  { className = "", size = "sm", ...props },
  ref,
) {
  const base =
    "w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 text-sm text-blue-200 placeholder:text-xs placeholder:text-blue-300/60 focus:border-[#18aead] focus:outline-none focus:ring-1 focus:ring-[#18aead]"
  const padding = sizeToPadding[size] ?? sizeToPadding.sm
  const combinedClassName = [base, padding, className].filter(Boolean).join(" ")

  return <input ref={ref} className={combinedClassName} {...props} />
})


