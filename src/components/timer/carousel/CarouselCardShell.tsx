type CarouselCardShellProps = {
  children: React.ReactNode
}

export function CarouselCardShell({ children }: CarouselCardShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {children}
    </div>
  )
}
