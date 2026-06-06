type AuthLinkProps = {
  label: string
  onClick: () => void
}

export function AuthLink({ label, onClick }: AuthLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[var(--color-purple)] underline underline-offset-4"
    >
      {label}
    </button>
  )
}
