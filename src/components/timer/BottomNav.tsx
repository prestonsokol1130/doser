import {
  HistoryNavIcon,
  InsightsNavIcon,
  SettingsNavIcon,
  TimerNavIcon,
  ToolsNavIcon,
} from './TimerIcons'

type NavTab = 'insights' | 'history' | 'timer' | 'tools' | 'settings'

type BottomNavProps = {
  activeTab?: NavTab
}

const TABS: { id: NavTab; label: string; icon: typeof TimerNavIcon }[] = [
  { id: 'insights', label: 'Insights', icon: InsightsNavIcon },
  { id: 'history', label: 'History', icon: HistoryNavIcon },
  { id: 'timer', label: 'Timer', icon: TimerNavIcon },
  { id: 'tools', label: 'Tools', icon: ToolsNavIcon },
  { id: 'settings', label: 'Settings', icon: SettingsNavIcon },
]

export function BottomNav({ activeTab = 'timer' }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-white/[0.04] px-2 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 text-[0.8125rem] ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-nav-inactive)]'
                }`}
              >
                <Icon />
                <span>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
