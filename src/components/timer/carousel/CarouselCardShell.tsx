import type { ReactNode } from 'react'

type CarouselCardShellProps = {
  children: ReactNode
}

export function CarouselCardShell({ children }: CarouselCardShellProps) {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-[var(--app-divider)] bg-[var(--app-surface)] p-4"
      style={{ borderRadius: '22px' }}
    >
      {children}
    </div>
  )
}
