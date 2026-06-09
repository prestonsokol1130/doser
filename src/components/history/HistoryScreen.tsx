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

function formatDateHeading(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function SubstanceBadge({ substance }: { substance: DoseSubstance }) {
  return (
    <span
      className="shrink-0 rounded-[6px] border border-[var(--app-divider)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--color-load)]"
      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
    >
      {substance}
    </span>
  )
}

export function HistoryScreen({
  doses,
  setDoses,
  nowMs,
}: HistoryScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [editingDose, setEditingDose] = useState<Dose | null>(null)

  const filtered = useMemo(() => {
    const list = [...doses].sort((a, b) => b.ts - a.ts)
    if (filter === 'all') return list
    return list.filter((d) => d.substance === filter)
  }, [doses, filter])

  const handleDelete = useCallback(
    (id: string) => {
      setDoses((prev) => prev.filter((d) => d.id !== id))
    },
    [setDoses],
  )

  const handleSaveEdit = useCallback(
    (updated: Dose) => {
      setDoses((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      )
    },
    [setDoses],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 px-4 pt-4 pb-2">
        <h1
          className="text-[18px] uppercase tracking-[0.2em] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
        >
          HISTORY
        </h1>
        <p
          className="mt-0.5 text-[11px] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          All logged doses
        </p>
      </header>

      <div className="flex shrink-0 gap-2 px-4 pb-3">
        {(['all', ...VALID_DOSE_SUBSTANCES] as const).map((option) => {
          const active = filter === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-[10px] border px-3 py-2 text-[10px] uppercase tracking-[0.12em] outline-none transition-opacity duration-[150ms] ${
                active
                  ? 'border-[var(--color-ring)] text-[var(--color-ring)]'
                  : 'border-[var(--app-divider)] text-[var(--app-faint)] hover:opacity-80'
              }`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              {option === 'all' ? 'ALL' : option}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <p
            className="py-12 text-center text-[13px] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            No doses logged yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((dose, index) => {
              const prior = index > 0 ? filtered[index - 1] : null
              const showDate =
                prior == null ||
                new Date(dose.ts).toDateString() !==
                  new Date(prior.ts).toDateString()

              return (
                <li key={dose.id}>
                  {showDate && (
                    <p
                      className="mb-1 mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {formatDateHeading(dose.ts)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 rounded-[12px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-3 transition-opacity duration-[150ms] hover:opacity-90">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left outline-none"
                      onClick={() => setEditingDose(dose)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[14px] text-[var(--app-text)]"
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >
                          {formatTimeShort(dose.ts)}
                        </span>
                        <SubstanceBadge substance={dose.substance} />
                      </div>
                      <p
                        className="mt-0.5 text-[12px] text-[var(--color-load)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {dose.amountMl.toFixed(2)} mL · {formatTimeAgo(dose.ts, nowMs)}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete dose"
                      onClick={() => handleDelete(dose.id)}
                      className="shrink-0 rounded-[8px] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-action)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      DELETE
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editingDose != null && (
        <EditDoseModal
          dose={editingDose}
          onSave={handleSaveEdit}
          onClose={() => setEditingDose(null)}
        />
      )}
    </div>
  )
}
