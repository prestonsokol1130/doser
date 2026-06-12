import { useCallback, useMemo, useState } from 'react'
import { formatTimeAgo } from '@/lib/sessionStats'
import type { Dose, DoseSubstance, Profile } from '@/types'
import { VALID_DOSE_SUBSTANCES } from '@/types'
import { formatTimeShort } from '../timer/timerUtils'
import { EditDoseModal } from './EditDoseModal'

type HistoryFilter = 'all' | DoseSubstance

type HistoryScreenProps = {
  doses: Dose[]
  setDoses: React.Dispatch<React.SetStateAction<Dose[]>>
  profile: Profile
  nowMs: number
}

// On-theme color per substance (replaces the v0 blue/orange/purple).
const SUBSTANCE_COLOR: Record<DoseSubstance, string> = {
  GBL: 'var(--color-ring)',
  BDO: 'var(--color-load)',
  GHB: 'var(--color-action)',
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function formatDateLabel(ts: number, nowMs: number): string {
  const target = startOfDay(ts)
  const today = startOfDay(nowMs)
  if (target === today) return 'Today'
  if (target === today - DAY_MS) return 'Yesterday'
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function SubstanceBadge({ substance }: { substance: DoseSubstance }) {
  const color = SUBSTANCE_COLOR[substance] ?? 'var(--color-load)'
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[6px] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      {substance}
    </span>
  )
}

// ─── Summary card (only shown on the ALL filter) ───────────────────────────────

function HistorySummary({ doses, nowMs }: { doses: Dose[]; nowMs: number }) {
  const totalMl = doses.reduce((s, d) => s + d.amountMl, 0)
  const totalDoses = doses.length

  const bySubstance = useMemo(() => {
    const acc: Partial<Record<DoseSubstance, number>> = {}
    for (const d of doses) acc[d.substance] = (acc[d.substance] ?? 0) + d.amountMl
    return acc
  }, [doses])

  const bars = useMemo(() => {
    const today = startOfDay(nowMs)
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = today - (6 - i) * DAY_MS
      const dayEnd = dayStart + DAY_MS
      const total = doses
        .filter((d) => d.ts >= dayStart && d.ts < dayEnd)
        .reduce((s, d) => s + d.amountMl, 0)
      return { total, label: new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short' })[0], isToday: i === 6 }
    })
  }, [doses, nowMs])
  const maxBar = Math.max(...bars.map((b) => b.total), 0.01)

  return (
    <div className="mx-3 mb-4 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Total doses
          </p>
          <p
            className="text-[28px] tabular-nums text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
          >
            {totalDoses}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Volume
          </p>
          <p
            className="text-[28px] tabular-nums text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
          >
            {totalMl.toFixed(1)}
            <span className="ml-1 text-[14px] text-[var(--color-load)]" style={{ fontFamily: 'var(--font-body)' }}>
              mL
            </span>
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p
          className="mb-2 text-[9px] uppercase tracking-[0.18em] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
        >
          Last 7 days
        </p>
        <div className="flex items-end gap-1" style={{ height: 32 }}>
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-[2px] transition-[height]"
                style={{
                  height: `${Math.max((bar.total / maxBar) * 24, bar.total > 0 ? 4 : 2)}px`,
                  backgroundColor: bar.isToday
                    ? 'var(--color-ring)'
                    : bar.total > 0
                      ? 'var(--app-dim)'
                      : 'var(--app-divider)',
                  opacity: bar.isToday ? 1 : 0.6,
                }}
              />
              <span
                className="text-[8px] uppercase leading-none"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: bar.isToday ? 'var(--app-text)' : 'var(--app-faint)',
                }}
              >
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {Object.entries(bySubstance).map(([sub, ml]) => {
          const color = SUBSTANCE_COLOR[sub as DoseSubstance] ?? 'var(--color-load)'
          return (
            <div key={sub} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
                {sub}
                <span className="ml-1 tabular-nums" style={{ color, fontWeight: 600 }}>
                  {(ml ?? 0).toFixed(1)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dose row ──────────────────────────────────────────────────────────────────

function DoseRow({
  dose,
  nowMs,
  onEdit,
  onDelete,
}: {
  dose: Dose
  nowMs: number
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-3 transition-opacity duration-[150ms] hover:opacity-95">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[8px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)]"
      >
        <span
          className="w-14 shrink-0 text-[14px] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
        >
          {formatTimeShort(dose.ts)}
        </span>
        <SubstanceBadge substance={dose.substance} />
        <span
          className="text-[15px] tabular-nums text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {dose.amountMl.toFixed(2)}
          <span className="ml-0.5 text-[11px] text-[var(--app-dim)]" style={{ fontWeight: 400 }}>
            mL
          </span>
        </span>
      </button>

      <span className="shrink-0 text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
        {formatTimeAgo(dose.ts, nowMs)}
      </span>
      <button
        type="button"
        aria-label="Delete dose"
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--app-faint)] outline-none transition-colors duration-[150ms] hover:text-[var(--color-action)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2.5 3.5h9M5.5 3.5V2.5h3v1M3.5 3.5l.6 8h5.8l.6-8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="var(--app-dim)" strokeWidth="1.5" />
          <path d="M7 4V3M13 4V3" stroke="var(--app-dim)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 8H17" stroke="var(--app-dim)" strokeWidth="1.5" />
          <path d="M7 12H9M11 12H13" stroke="var(--app-faint)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-[14px] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
          No doses logged yet
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
          Your dose history will appear here once you start logging.
        </p>
      </div>
    </div>
  )
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export function HistoryScreen({ doses, setDoses, nowMs }: HistoryScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [editingDose, setEditingDose] = useState<Dose | null>(null)

  const filtered = useMemo(() => {
    const list = [...doses].sort((a, b) => b.ts - a.ts)
    return filter === 'all' ? list : list.filter((d) => d.substance === filter)
  }, [doses, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Dose[]>()
    for (const dose of filtered) {
      const key = new Date(dose.ts).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(dose)
    }
    return Array.from(map.entries())
  }, [filtered])

  const handleDelete = useCallback(
    (id: string) => setDoses((prev) => prev.filter((d) => d.id !== id)),
    [setDoses],
  )

  const handleSaveEdit = useCallback(
    (updated: Dose) => setDoses((prev) => prev.map((d) => (d.id === updated.id ? updated : d))),
    [setDoses],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between">
          <h1
            className="text-[18px] uppercase tracking-[0.2em] text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            HISTORY
          </h1>
          <span
            className="text-[10px] uppercase tracking-[0.16em] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--color-load)]" style={{ fontFamily: 'var(--font-body)' }}>
          All logged doses
        </p>
      </header>

      <div className="flex shrink-0 gap-2 px-4 pb-4">
        {(['all', ...VALID_DOSE_SUBSTANCES] as const).map((option) => {
          const active = filter === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className="rounded-[10px] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] outline-none transition-opacity duration-[150ms] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)]"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: active ? '#000' : 'var(--app-dim)',
                backgroundColor: active ? 'var(--color-ring)' : 'var(--app-surface-alt)',
              }}
            >
              {option === 'all' ? 'ALL' : option}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filter === 'all' && doses.length > 0 && <HistorySummary doses={doses} nowMs={nowMs} />}

            <div className="flex flex-col gap-4 pb-6">
              {grouped.map(([key, entries]) => {
                const total = entries.reduce((s, d) => s + d.amountMl, 0)
                return (
                  <section key={key}>
                    <div className="mb-2 flex items-center justify-between px-4">
                      <span
                        className="text-[10px] uppercase tracking-[0.16em] text-[var(--app-dim)]"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                      >
                        {formatDateLabel(entries[0].ts, nowMs)}
                      </span>
                      <span
                        className="text-[10px] tabular-nums text-[var(--app-faint)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {total.toFixed(1)} mL total
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 px-3">
                      {entries.map((dose) => (
                        <DoseRow
                          key={dose.id}
                          dose={dose}
                          nowMs={nowMs}
                          onEdit={() => setEditingDose(dose)}
                          onDelete={() => handleDelete(dose.id)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </div>

      {editingDose != null && (
        <EditDoseModal dose={editingDose} onSave={handleSaveEdit} onClose={() => setEditingDose(null)} />
      )}
    </div>
  )
}
