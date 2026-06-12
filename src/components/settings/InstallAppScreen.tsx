import { useEffect, useState } from 'react'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type InstallAppScreenProps = {
  onBack: () => void
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppScreen({ onBack }: InstallAppScreenProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true
    if (standalone) setInstalled(true)

    function handleBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setMessage(null)
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Install App"
        subtitle="Add Doser to your home screen"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {installed ? (
          <p
            className="text-[13px] text-[var(--color-ring)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Doser is installed or running as a standalone app.
          </p>
        ) : (
          <>
            <p
              className="text-[13px] text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Install Doser as a PWA for quick access from your home screen.
              The install prompt may not appear in private browsing.
            </p>

            {deferredPrompt ? (
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="mt-4 h-12 w-full rounded-[14px] bg-[var(--color-ring)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-bg)] outline-none transition-opacity duration-[150ms]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Install Now
              </button>
            ) : (
              <div className="mt-4 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
                <p
                  className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Manual Install
                </p>
                <p
                  className="mt-2 text-[12px] text-[var(--app-dim)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  iOS: Share → Add to Home Screen. Android / Chrome: Menu →
                  Install app or Add to Home screen.
                </p>
              </div>
            )}
          </>
        )}

        {message ? (
          <p
            className="mt-4 text-[12px] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
