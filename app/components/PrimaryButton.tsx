import { ReactNode, forwardRef } from "react"
import { Button, ButtonProps } from "antd"

type PrimarySize = "sm" | "md" | "lg" | "small" | "middle" | "large"

type PrimaryButtonProps = Omit<ButtonProps, "type" | "size" | "variant"> & {
  icon?: ReactNode
  iconPosition?: "left" | "right"
  type?: "button" | "submit" | "reset"
  size?: PrimarySize
  variant?: "primary" | "brand" // primary = blue, brand = green
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(function PrimaryButton(
  { children, icon, iconPosition = "left", className = "", disabled, type = "button", size = "md", variant = "primary", ...props },
  ref,
) {
  const mappedSize: ButtonProps["size"] =
    size === "lg" || size === "large"
      ? "large"
      : size === "sm" || size === "small"
      ? "small"
      : "middle"

  const colorClasses = variant === "brand"
    ? "!bg-[#18aead] !border-[#18aead] hover:!bg-[#18aead]/90 hover:!border-[#18aead] active:!bg-[#18aead]/80 active:!border-[#18aead] focus:!bg-[#18aead] focus:!border-[#18aead]"
    : "!bg-[#2b9bff] !border-[#2b9bff] hover:!bg-[#2b9bff]/90 hover:!border-[#2b9bff] active:!bg-[#2b9bff]/80 active:!border-[#2b9bff] focus:!bg-[#2b9bff] focus:!border-[#2b9bff]"

  return (
    <Button
      ref={ref}
      type="primary"
      htmlType={type}
      disabled={disabled}
      size={mappedSize}
      className={`${className} ${colorClasses} !rounded-[9999999999999999999px] text-white`}
      icon={iconPosition === "left" ? icon : undefined}
      {...props}
    >
      {iconPosition === "right" ? (
        <span className="inline-flex items-center gap-2">
          {children}
          {icon}
        </span>
      ) : (
        children
      )}
    </Button>
  )
})

