import type { ReactNode } from 'react'

type CarouselCardShellProps = {
  children: ReactNode
  className?: string
}

export function CarouselCardShell({
  children,
  className = '',
}: CarouselCardShellProps) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] py-8 px-4 ${className}`}
    >
      {children}
    </div>
  )
}
