import type { ReactNode } from "react"

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-border bg-card ${className}`}>
      {children}
    </div>
  )
}
