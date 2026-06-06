import { useCallback, useEffect, useRef, useState } from 'react'
import { computePerceivedEffectLevelAt } from '../../lib/perceivedEffect/perceivedEffectModel'
import { preferredDoseMl } from '../../store/appStore'
import { auth } from '../../lib/firebase'
import {
  defaultProfile,
  fetchUserDocument,
} from '../../store/profileStore'
import type { Dose, Profile, Substance } from '../../types'
import {
  BarChartIcon,
  ChevronDownIcon,
  ClockIcon,
  FlashlightIcon,
  HistoryNavIcon,
  InsightsNavIcon,
  MinusIcon,
  PlusIcon,
  SettingsNavIcon,
  TargetIcon,
  TimerNavIcon,
  ToolsNavIcon,
} from './TimerIcons'
import { CurrentStateCard } from './carousel/CurrentStateCard'
import { ForecastCard } from './carousel/ForecastCard'
import { Past12HoursCard } from './carousel/Past12HoursCard'
import { SessionCompareCard } from './carousel/SessionCompareCard'
import { TimerRingCard } from './carousel/TimerRingCard'
import { TodayCard } from './carousel/TodayCard'
import { CarouselCardShell } from './carousel/CarouselCardShell'
import { TimerCarousel, CarouselDots } from './carousel/TimerCarousel'
import {
  DOSE_SCALE_MAX,
  DOSE_SCALE_MIN,
  DOSE_SCALE_STEP,
  computeNextWindowMs,
  createDoseId,
  formatDoseMl,
  formatTimeShort,
  isWaitingForWindow,
  lastDose,
  scaleTickValues,
  sessionDosesToday,
  snapDoseToScale,
} from './timerUtils'

type NavTab = 'insights' | 'history' | 'timer' | 'tools' | 'settings'

const NAV_TABS: { id: NavTab; label: string; icon: typeof TimerNavIcon }[] = [
  { id: 'insights', label: 'Insights', icon: InsightsNavIcon },
  { id: 'history', label: 'History', icon: HistoryNavIcon },
  { id: 'timer', label: 'Timer', icon: TimerNavIcon },
  { id: 'tools', label: 'Tools', icon: ToolsNavIcon },
  { id: 'settings', label: 'Settings', icon: SettingsNavIcon },
]

export function TimerScreen() {
  const [profile, setProfile] = useState<Profile>(() => defaultProfile())
  const [profileLoading, setProfileLoading] = useState(true)
  const [doses, setDoses] = useState<Dose[]>([])
  const [substance, setSubstance] = useState<Substance>('GBL')
  const [doseMl, setDoseMl] = useState(() =>
    snapDoseToScale(defaultProfile().gbl.preferredDoseMl),
  )
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const carouselScrollToRef = useRef<((index: number) => void) | null>(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) {
      setProfileLoading(false)
      return
    }

    let active = true
    fetchUserDocument(uid)
      .then((doc) => {
        if (!active) return
        const loaded = doc?.profile ?? defaultProfile()
        setProfile(loaded)
        setDoseMl(snapDoseToScale(preferredDoseMl('GBL', loaded)))
      })
      .catch(() => {
        if (!active) return
        setProfile(defaultProfile())
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const handleScrollToReady = useCallback((scrollTo: (index: number) => void) => {
    carouselScrollToRef.current = scrollTo
  }, [])

  function toggleSubstance() {
    const next: Substance = substance === 'GBL' ? 'BDO' : 'GBL'
    setSubstance(next)
    setDoseMl(snapDoseToScale(preferredDoseMl(next, profile)))
  }

  function handleLogEntry() {
    const entry: Dose = {
      id: createDoseId(),
      substance,
      amountMl: doseMl,
      ts: Date.now(),
    }
    setDoses((prev) => [...prev, entry])
  }

  function stepDose(delta: number) {
    setDoseMl(snapDoseToScale(doseMl + delta * DOSE_SCALE_STEP))
  }

  const todayDoses = sessionDosesToday(doses, substance, nowMs)
  const sessionTotalMl = todayDoses.reduce((sum, d) => sum + d.amountMl, 0)
  const recent = lastDose(doses, substance)
  const nextWindowMs = computeNextWindowMs(doses, substance, profile)
  const waiting = isWaitingForWindow(nextWindowMs, nowMs)
  const countdownMs =
    nextWindowMs && waiting ? Math.max(0, nextWindowMs - nowMs) : 0

  const pel = computePerceivedEffectLevelAt(doses, profile, nowMs)

  const lastEntryValue = recent
    ? `${formatDoseMl(recent.amountMl)} • ${formatTimeShort(recent.ts)}`
    : '—'

  const sessionTotalValue =
    todayDoses.length > 0 ? `${sessionTotalMl.toFixed(2)} mL` : '—'

  const ticks = scaleTickValues()
  const activeTickIndex = Math.round((doseMl - DOSE_SCALE_MIN) / DOSE_SCALE_STEP)

  if (profileLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]"
      >
        <p className="text-sm text-[var(--color-text-dim)]">Loading timer…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[var(--color-bg)]">
      {/* Header + stat row — fixed at top, never scrolled away */}
      <div className="shrink-0 px-6 pt-[max(3rem,env(safe-area-inset-top))]">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[3.5rem] font-light lowercase leading-none tracking-[0.16em] text-[var(--color-text)]">
              doser
            </h1>
            <p className="mt-2 text-sm uppercase tracking-[0.34em] text-[var(--color-purple)]">
              TIMING AWARENESS
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="Flashlight"
              className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              <FlashlightIcon />
            </button>

            <button
              type="button"
              onClick={toggleSubstance}
              aria-label={`Selected substance ${substance}. Tap to switch.`}
              className="flex h-[4.75rem] min-w-[8rem] items-center justify-center gap-2 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]"
                aria-hidden
              />
              <span>{substance}</span>
              <ChevronDownIcon className="text-[var(--color-text-dim)]" />
            </button>
          </div>
        </header>

        <div className="mt-6 flex gap-3">
          <div className="flex-1 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              LAST ENTRY
            </p>
            <div className="mt-2 flex items-center gap-2 text-base text-[var(--color-text)]">
              <ClockIcon className="shrink-0 text-[var(--color-accent)]" />
              <span className="truncate">{lastEntryValue}</span>
            </div>
          </div>

          <div className="flex-1 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              SESSION TOTAL
            </p>
            <div className="mt-2 flex items-center gap-2 text-base text-[var(--color-text)]">
              <BarChartIcon className="shrink-0 text-[var(--color-accent)]" />
              <span className="truncate">{sessionTotalValue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable main content */}
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <div className="mt-6">
          <TimerCarousel
          activeIndex={carouselIndex}
          onActiveIndexChange={setCarouselIndex}
          onScrollToReady={handleScrollToReady}
        >
          <CarouselCardShell>
            <TimerRingCard
              pelPercent={pel.percent}
              waiting={waiting}
              countdownMs={countdownMs}
              nextWindowMs={nextWindowMs}
            />
          </CarouselCardShell>
          <TodayCard />
          <CurrentStateCard
            pelPercent={pel.percent}
            trend={pel.tolerance.trend}
            nextWindowMs={nextWindowMs}
            sessionCount={todayDoses.length}
            sessionTotalMl={sessionTotalMl}
          />
          <Past12HoursCard />
          <ForecastCard />
          <SessionCompareCard />
        </TimerCarousel>
        </div>

        <CarouselDots
          count={6}
          activeIndex={carouselIndex}
          onSelect={(index) => carouselScrollToRef.current?.(index)}
        />

        {/* Dose card */}
        <section className="mt-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-center text-[0.9375rem] uppercase tracking-[0.34em] text-[var(--color-purple)]">
            DOSE AMOUNT
          </p>

          <div className="mt-4 grid grid-cols-[5.375rem_minmax(0,1fr)_5.375rem] items-center gap-2">
            <button
              type="button"
              aria-label="Decrease dose"
              onClick={() => stepDose(-1)}
              disabled={doseMl <= DOSE_SCALE_MIN}
              className="flex h-[5.375rem] w-[5.375rem] items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent)] disabled:opacity-40"
            >
              <MinusIcon />
            </button>

            <div className="flex min-w-0 items-baseline justify-center gap-2">
              <span className="text-[clamp(3rem,14vw,5.25rem)] font-light leading-none text-[var(--color-text)]">
                {formatDoseMl(doseMl)}
              </span>
              <span className="text-[1.375rem] leading-none text-[var(--color-purple)]">
                mL
              </span>
            </div>

            <button
              type="button"
              aria-label="Increase dose"
              onClick={() => stepDose(1)}
              disabled={doseMl >= DOSE_SCALE_MAX}
              className="flex h-[5.375rem] w-[5.375rem] items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent)] disabled:opacity-40"
            >
              <PlusIcon />
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between">
              {ticks.map((tick, index) => {
                const isActive = index === activeTickIndex
                const isMajor = index % 4 === 0
                return (
                  <button
                    key={tick}
                    type="button"
                    aria-label={`Set dose to ${tick.toFixed(2)} milliliters`}
                    onClick={() => setDoseMl(tick)}
                    className="w-px shrink-0 rounded-full"
                    style={{
                      height: isActive ? '3.5rem' : isMajor ? '2rem' : '1rem',
                      backgroundColor: isActive
                        ? 'var(--color-accent)'
                        : isMajor
                          ? 'var(--color-tick-major)'
                          : 'var(--color-tick-minor)',
                    }}
                  />
                )
              })}
            </div>
            <div className="mt-2 flex justify-between">
              {ticks.map((tick, index) => {
                if (index % 4 !== 0) {
                  return <span key={tick} className="w-px shrink-0" aria-hidden />
                }
                const isActive = index === activeTickIndex
                return (
                  <span
                    key={tick}
                    className={`text-base leading-none ${
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-dim)]'
                    }`}
                  >
                    {tick.toFixed(2)}
                  </span>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogEntry}
            className="mt-8 flex h-[5.125rem] w-full items-center justify-center gap-3 rounded-[18px] bg-[var(--color-cta)] text-[1.375rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-bg)]"
          >
            <TargetIcon />
            LOG ENTRY
          </button>
        </section>
      </main>

      {/* Bottom nav */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 shrink-0 border-t border-[var(--color-border)] bg-white/[0.04] px-2 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_TABS.map(({ id, label, icon: Icon }) => {
            const active = id === 'timer'
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full flex-col items-center gap-2 py-1 ${
                    active
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-nav-inactive)]'
                  }`}
                >
                  <Icon className="h-8 w-8 shrink-0" />
                  <span className="text-[0.8125rem] leading-none">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
