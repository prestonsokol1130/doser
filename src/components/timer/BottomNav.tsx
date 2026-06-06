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

const tabs: { id: NavTab; label: string; Icon: typeof TimerNavIcon }[] = [
  { id: 'insights', label: 'Insights', Icon: InsightsNavIcon },
  { id: 'history', label: 'History', Icon: HistoryNavIcon },
  { id: 'timer', label: 'Timer', Icon: TimerNavIcon },
  { id: 'tools', label: 'Tools', Icon: ToolsNavIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsNavIcon },
]

export function BottomNav({ activeTab = 'timer' }: BottomNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="shrink-0 border-t border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ id, label, Icon }) => {
          const active = id === activeTab
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-1 py-1"
            >
              <Icon
                className={`h-6 w-6 ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-nav-inactive)]'
                }`}
              />
              <span
                className={`text-[11px] ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-nav-inactive)]'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
