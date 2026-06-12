// ─────────────────────────────────────────────────────────────────────────────
//  StashScreen — final redesign (Claude Design handoff, theme-conformed)
//
//  Hero: horizontal liquid-tank SVG · inline refill · stat pills
//  Quick adjust: compact 2-row card (remove top, add bottom)
//  Adjust: AccelStepper (hold-to-accelerate) + low-alert preset chips
//
//  All colors route through design-system tokens (--color-ring / --color-action /
//  --color-load / --app-*). Accent tints use color-mix so nothing is hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dose, Profile } from '@/types'
import {
  isStashLow,
  stashConsumedMl,
  stashFullMl,
  stashRemainingMl,
  stashRemainingPct,
} from '@/lib/stash'
import { SubScreenHeader } from './SubScreenHeader'

// Idle liquid agitation (0–1). Volume adjustments spike toward 1.0, then ease back
// to BASE_AGITATION via requestAnimationFrame on --liquid-agitation.
const BASE_AGITATION = 0.28

// ─── types ────────────────────────────────────────────────────────────────────

type StashScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  doses: Dose[]
  onBack: () => void
}

// ─── constants ────────────────────────────────────────────────────────────────

const QUICK_REMOVE = [5, 10, 25, 50] as const
const QUICK_ADD    = [10, 25, 50, 100] as const
const LOW_PRESETS  = [10, 15, 20, 25, 30] as const

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseMl(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function clampWhole(value: number, min = 0, max = 10_000): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function formatDaysLeft(days: number | null): string {
  if (days == null || !Number.isFinite(days)) return 'Pace still calibrating'
  if (days < 1) return 'Less than 1 day left at recent pace'
  return `~${days.toFixed(1)} days left at recent pace`
}

// ─── StashVessel ──────────────────────────────────────────────────────────────
//  Horizontal liquid-tank visual. Intentionally different from TimerRingCard
//  so users on session cannot confuse the two.

type StashVesselProps = {
  pct: number
  remainingMl: number
  fullMl: number
  isLow: boolean
  /** Increments on each volume adjust; spikes liquid agitation briefly. */
  boostSignal: number
}

function StashVessel({ pct, remainingMl, fullMl, isLow, boostSignal }: StashVesselProps) {
  const fillPct   = Math.max(0, Math.min(100, pct))
  const accent    = isLow ? 'var(--color-action)' : 'var(--color-ring)'
  const fillColor = isLow
    ? 'color-mix(in srgb, var(--color-action) 18%, transparent)'
    : 'color-mix(in srgb, var(--color-ring) 18%, transparent)'
  const hasData   = fullMl > 0
  const statusLbl = isLow ? '· LOW ·' : hasData ? `${fillPct}%` : '—'
  const showWave  = fillPct > 4 && fillPct < 97
  const showGlow  = fillPct > 3

  // On each adjust (boostSignal change) spike --liquid-agitation to 1.0 and ease
  // back to idle over ~1.5s, writing straight to the DOM node so it doesn't re-render.
  const surfaceRef = useRef<HTMLDivElement>(null)
  const rafRef     = useRef<number | null>(null)
  const firstRun   = useRef(true)

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    const el = surfaceRef.current
    if (!el) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    el.style.setProperty('--liquid-agitation', '1')
    const start = performance.now()
    const DUR = 1500
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DUR)
      const v = BASE_AGITATION + (1 - BASE_AGITATION) * (1 - t) * (1 - t)
      el.style.setProperty('--liquid-agitation', String(v))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [boostSignal])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div className="flex flex-col items-start w-full py-1">
      {/* big number */}
      <div className="flex items-baseline gap-[5px] mb-3">
        <span
          className="leading-none text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 200, fontSize: 72 }}
        >
          {hasData ? Math.round(remainingMl) : '--'}
        </span>
        <span
          className="text-[18px] font-medium text-[var(--color-load)] mb-1"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          mL
        </span>
        <span
          className="text-[12px] text-[var(--app-faint)] mb-2 ml-1"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          remaining
        </span>
      </div>

      {/* tank */}
      <div
        className="relative w-full overflow-hidden rounded-[16px] border bg-[var(--app-bg)]"
        style={{
          height: 80,
          borderColor: isLow
            ? 'color-mix(in srgb, var(--color-action) 25%, transparent)'
            : 'var(--app-divider)',
          transition: 'border-color 0.3s ease',
        }}
      >
        {fillPct > 0 && (
          <>
            {/* Liquid body — fill height tracks stash volume */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: `${fillPct}%`,
                background: fillColor,
                transition: 'height 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            {/* Surface — wave drift + glow line anchored to the fill level */}
            <div
              ref={surfaceRef}
              aria-hidden
              className="stash-liquid-surface pointer-events-none absolute inset-x-0 overflow-hidden"
              style={{
                bottom: `calc(${fillPct}% - 7px)`,
                height: 14,
                transition: 'bottom 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
                ['--liquid-agitation' as string]: String(BASE_AGITATION),
              }}
            >
              <div
                className="absolute inset-x-0 top-0 overflow-hidden"
                style={{
                  height: 14,
                  opacity: showWave ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <svg
                  viewBox="0 0 1440 14"
                  preserveAspectRatio="none"
                  className="stash-wave-drift"
                  style={{ color: accent }}
                  aria-hidden
                >
                  <path
                    d="M0,7 C90,0 90,14 180,7 C270,0 270,14 360,7 C450,0 450,14 540,7 C630,0 630,14 720,7 C810,0 810,14 900,7 C990,0 990,14 1080,7 C1170,0 1170,14 1260,7 C1350,0 1350,14 1440,7 C1530,0 1530,14 1620,7 C1710,0 1710,14 1800,7 C1890,0 1890,14 1980,7 C2070,0 2070,14 2160,7 C2250,0 2250,14 2340,7 C2430,0 2430,14 2520,7 C2610,0 2610,14 2700,7 C2790,0 2790,14 2880,7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div
                className="absolute inset-x-0"
                style={{
                  top: 6,
                  height: 1,
                  background: accent,
                  opacity: showGlow ? 0.55 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            </div>
          </>
        )}

        {/* tick marks at 25 / 50 / 75 % */}
        {([25, 50, 75] as const).map(t => (
          <div
            key={t}
            className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: `${t}%`, height: '0.5px', background: 'var(--app-divider)' }}
          >
            <span
              className="absolute right-[10px] text-[8px] font-semibold text-[var(--app-faint)]"
              style={{ top: -8, fontFamily: 'var(--font-body)' }}
            >
              {t}%
            </span>
          </div>
        ))}

        {/* centre label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.24em]"
            style={{
              color: isLow ? 'var(--color-action)' : 'var(--app-faint)',
              fontFamily: 'var(--font-body)',
              transition: 'color 0.3s ease',
            }}
          >
            {statusLbl}
          </span>
        </div>
      </div>

      {/* capacity footnote */}
      <p
        className="mt-[6px] self-end text-[10px] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        of {hasData ? Math.round(fullMl) : '--'} mL capacity
      </p>
    </div>
  )
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

type StatPillProps = { label: string; value: string; highlight?: boolean }

function StatPill({ label, value, highlight = false }: StatPillProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-[14px] border px-[10px] py-[10px]"
      style={{
        background: highlight
          ? 'color-mix(in srgb, var(--color-action) 8%, transparent)'
          : 'var(--app-bg)',
        borderColor: highlight
          ? 'color-mix(in srgb, var(--color-action) 22%, transparent)'
          : 'var(--app-divider)',
      }}
    >
      <p
        className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
      <p
        className={[
          'mt-[3px] text-[22px] leading-[1.3]',
          highlight ? 'text-[var(--color-action)]' : 'text-[var(--app-text)]',
        ].join(' ')}
        style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
      >
        {value}
      </p>
    </div>
  )
}

// ─── AccelStepper ─────────────────────────────────────────────────────────────
//  Tap for ±1 mL. Hold — accelerates to ±30/tick after ~half a second.

type AccelStepperProps = {
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}

function AccelStepper({ label, description, value, min, max, step, unit, onChange }: AccelStepperProps) {
  const liveRef  = useRef(value)
  const timerRef = useRef<{ t: ReturnType<typeof setTimeout> | null; i: ReturnType<typeof setInterval> | null }>({ t: null, i: null })
  const rateRef  = useRef(1)

  useEffect(() => { liveRef.current = value }, [value])
  useEffect(() => () => {
    if (timerRef.current.t) clearTimeout(timerRef.current.t)
    if (timerRef.current.i) clearInterval(timerRef.current.i)
  }, [])

  function nudge(dir: 1 | -1, mult = 1) {
    liveRef.current = Math.max(min, Math.min(max, liveRef.current + dir * step * mult))
    onChange(liveRef.current)
  }

  function press(dir: 1 | -1) {
    nudge(dir)
    rateRef.current = 1
    timerRef.current.t = setTimeout(() => {
      timerRef.current.i = setInterval(() => {
        rateRef.current = Math.min(rateRef.current * 1.18, 30)
        nudge(dir, Math.round(rateRef.current))
      }, 75)
    }, 420)
  }

  function release() {
    if (timerRef.current.t) clearTimeout(timerRef.current.t)
    if (timerRef.current.i) clearInterval(timerRef.current.i)
    timerRef.current = { t: null, i: null }
    rateRef.current = 1
  }

  return (
    <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-[13px]">
      <p
        className="text-[14px] font-semibold text-[var(--app-text)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
      <p
        className="mt-[2px] mb-3 text-[11px] leading-[1.45] text-[var(--app-dim)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {description}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={() => press(-1)}
          onPointerUp={release}
          onPointerLeave={release}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-surface-alt)] text-[26px] text-[var(--app-text)] outline-none"
          style={{ fontFamily: 'var(--font-body)', userSelect: 'none', touchAction: 'none' }}
        >
          −
        </button>

        <div className="flex h-[52px] flex-1 items-center justify-center gap-[5px] rounded-[12px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
          <span
            className="leading-none text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 200, fontSize: 30 }}
          >
            {value}
          </span>
          <span
            className="text-[13px] font-medium text-[var(--color-load)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {unit}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={() => press(1)}
          onPointerUp={release}
          onPointerLeave={release}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-surface-alt)] text-[26px] text-[var(--color-ring)] outline-none"
          style={{ fontFamily: 'var(--font-body)', userSelect: 'none', touchAction: 'none' }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── StashScreen (main export) ────────────────────────────────────────────────

export function StashScreen({
  profile,
  onProfileChange,
  doses,
  onBack,
}: StashScreenProps) {
  const [refillStr, setRefillStr] = useState('')
  const [boost, setBoost] = useState(0)
  const bumpLiquidMotion = () => setBoost(b => b + 1)

  const remaining = stashRemainingMl(profile.stash, doses)
  const consumed  = stashConsumedMl(doses, profile.stash.refillAt)
  const pct       = stashRemainingPct(profile.stash, doses)
  const low       = isStashLow(profile, doses)
  const fullMl    = stashFullMl(profile.stash)

  const recentDailyUsage = useMemo(() => {
    const lookbackStart = Date.now() - 7 * 24 * 60 * 60 * 1000
    const total = doses
      .filter(d => d.ts >= lookbackStart)
      .reduce((sum, d) => sum + d.amountMl, 0)
    return total > 0 ? total / 7 : null
  }, [doses])

  const daysLeft  = recentDailyUsage ? remaining / recentDailyUsage : null
  const statusStr = low
    ? 'Refill soon'
    : pct >= 70 ? 'Comfortable'
    : pct >= 35 ? 'Mid-range'
    : 'Watch supply'

  // ── mutations ──────────────────────────────────────────────────────────────

  // Adjust the current on-hand amount within the existing container. fullMl (the
  // 100% reference) only grows if the new amount exceeds it, so the tank depletes
  // as the amount drops below full.
  function setCurrent(nextMl: number) {
    const amount = clampWhole(nextMl, 0, 5_000)
    bumpLiquidMotion()
    onProfileChange({
      ...profile,
      stash: {
        capacityMl: amount,
        fullMl: Math.max(stashFullMl(profile.stash), amount),
        refillAt: amount > 0 ? Date.now() : profile.stash.refillAt,
      },
    })
  }

  // A refill defines a fresh full container — this is the new 100% reference.
  function refillTo(nextMl: number) {
    const amount = clampWhole(nextMl, 0, 5_000)
    bumpLiquidMotion()
    onProfileChange({
      ...profile,
      stash: { capacityMl: amount, fullMl: amount, refillAt: Date.now() },
    })
  }

  function topUp(ml: number) { setCurrent(remaining + ml) }
  function removeFromStash(ml: number) { setCurrent(Math.max(0, remaining - ml)) }

  function handleRefill() {
    const val = parseMl(refillStr)
    if (val <= 0) return
    refillTo(val)
    setRefillStr('')
  }

  function updateThreshold(next: number) {
    onProfileChange({
      ...profile,
      notif: { ...profile.notif, stashLowThresholdPct: clampWhole(next, 5, 95) },
    })
  }

  const canRefill = parseMl(refillStr) > 0

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Stash"
        subtitle="Personal inventory snapshot"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[13px] pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3">

          {/* ── Hero card ─────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-[14px] pb-[14px] pt-4">
            <StashVessel
              pct={pct}
              remainingMl={remaining}
              fullMl={fullMl}
              isLow={low}
              boostSignal={boost}
            />

            {/* stat pills */}
            <div className="mt-1 flex gap-[7px]">
              <StatPill label="Consumed" value={`${consumed.toFixed(0)} mL`} />
              <StatPill
                label="Days left"
                value={daysLeft != null && Number.isFinite(daysLeft) ? daysLeft.toFixed(1) : '--'}
              />
              <StatPill label="Status" value={statusStr} highlight={low} />
            </div>

            {/* inline refill — anchored to the visual it controls */}
            <div className="mt-[10px] flex gap-[7px]">
              <div className="flex h-[38px] flex-1 items-center rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-bg)]">
                <input
                  type="text"
                  inputMode="numeric"
                  value={refillStr}
                  onChange={e => setRefillStr(e.target.value)}
                  placeholder="New refill amount…"
                  className="flex-1 bg-transparent text-[13px] text-[var(--app-text)] outline-none px-[10px]"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
                <span
                  className="pr-[9px] text-[11px] text-[var(--app-faint)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  mL
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefill}
                disabled={!canRefill}
                className="h-[38px] shrink-0 rounded-[10px] px-4 text-[12px] font-bold uppercase tracking-[0.08em] outline-none transition-all duration-[180ms] disabled:opacity-30"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: canRefill ? 'var(--color-ring)' : 'var(--app-surface-alt)',
                  color: canRefill ? '#000' : 'var(--app-faint)',
                }}
              >
                Refill
              </button>
            </div>

            {/* pace badge */}
            <div className="mt-3 flex justify-center">
              <div className="inline-flex rounded-full border border-[var(--app-divider)] bg-[var(--app-bg)] px-4 py-[9px]">
                <span
                  className="text-[12px] text-[var(--app-dim)]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {formatDaysLeft(daysLeft)}
                </span>
              </div>
            </div>
          </section>

          {/* ── Quick adjust — compact double-row ─────────────────────── */}
          <section>
            <p
              className="mb-[9px] text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Quick adjust
            </p>
            <div className="overflow-hidden rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
              {/* remove row */}
              <div className="flex gap-[6px] p-[10px_10px_7px]">
                {QUICK_REMOVE.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => removeFromStash(a)}
                    className="flex flex-1 flex-col items-center gap-[2px] rounded-[11px] border py-[9px] outline-none transition-opacity duration-[120ms] active:opacity-60"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-action) 25%, transparent)',
                      background: 'color-mix(in srgb, var(--color-action) 7%, transparent)',
                      color: 'var(--color-action)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <span>−{a}</span>
                    <span className="text-[8px] font-bold tracking-[0.15em] opacity-45">ML</span>
                  </button>
                ))}
              </div>

              {/* divider */}
              <div className="mx-[10px] h-px bg-[var(--app-divider)]" />

              {/* add row */}
              <div className="flex gap-[6px] p-[7px_10px_10px]">
                {QUICK_ADD.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => topUp(a)}
                    className="flex flex-1 flex-col items-center gap-[2px] rounded-[11px] border py-[9px] outline-none transition-opacity duration-[120ms] active:opacity-60"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-ring) 25%, transparent)',
                      background: 'color-mix(in srgb, var(--color-ring) 7%, transparent)',
                      color: 'var(--color-ring)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <span>+{a}</span>
                    <span className="text-[8px] font-bold tracking-[0.15em] opacity-45">ML</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Adjust ────────────────────────────────────────────────── */}
          <section>
            <p
              className="mb-[9px] text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Adjust
            </p>
            <div className="flex flex-col gap-2 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-3">

              {/* current amount — accel stepper */}
              <AccelStepper
                label="Current amount"
                description="Tap ±1 mL · hold to accelerate"
                value={Math.round(remaining)}
                min={0}
                max={fullMl > 0 ? fullMl : 2000}
                step={1}
                unit="mL"
                onChange={v => setCurrent(v)}
              />

              {/* low alert — preset chips */}
              <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-[12px_14px]">
                <p
                  className="text-[14px] font-semibold text-[var(--app-text)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Low alert
                </p>
                <p
                  className="mt-[2px] mb-[11px] text-[11px] leading-[1.45] text-[var(--app-dim)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Notify when stash drops below
                </p>
                <div className="flex gap-[7px]">
                  {LOW_PRESETS.map(v => {
                    const sel = profile.notif.stashLowThresholdPct === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updateThreshold(v)}
                        className="flex-1 rounded-[12px] border py-[10px] text-[13px] font-bold outline-none transition-all duration-[150ms]"
                        style={{
                          fontFamily: 'var(--font-body)',
                          borderColor: sel ? 'transparent' : 'var(--app-divider)',
                          background: sel ? 'var(--color-ring)' : 'var(--app-surface)',
                          color: sel ? '#000' : 'var(--app-dim)',
                        }}
                      >
                        {v}%
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <p
            className="text-center text-[10px] leading-[1.7] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Stash subtracts logged doses from your most recent refill reset.
            Quick adjust and current-amount edits both create a fresh baseline.
          </p>
        </div>
      </div>
    </div>
  )
}
