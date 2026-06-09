import { useEffect, useState } from 'react'
import type { Dose, DoseSubstance } from '@/types'
import { VALID_DOSE_SUBSTANCES } from '@/types'
import { DOSE_MAX, DOSE_MIN, snapDoseToStep } from '../timer/timerUtils'

type EditDoseModalProps = {
  dose: Dose
  onSave: (updated: Dose) => void
  onClose: () => void
}

function toLocalDatetimeValue(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditDoseModal({ dose, onSave, onClose }: EditDoseModalProps) {
  const [amountStr, setAmountStr] = useState(String(dose.amountMl))
  const [substance, setSubstance] = useState<DoseSubstance>(dose.substance)
  const [datetime, setDatetime] = useState(toLocalDatetimeValue(dose.ts))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
    setError(null)
    const parsed = parseFloat(amountStr)
    if (!Number.isFinite(parsed) || parsed < DOSE_MIN || parsed > DOSE_MAX) {
      setError(`Amount must be between ${DOSE_MIN.toFixed(1)} and ${DOSE_MAX.toFixed(1)} mL.`)
      return
    }
    const ts = new Date(datetime).getTime()
    if (!Number.isFinite(ts)) {
      setError('Enter a valid date and time.')
      return
    }

    onSave({
      ...dose,
      substance,
      amountMl: snapDoseToStep(parsed),
      ts,
      updatedAt: Date.now(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.65)] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dose-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="edit-dose-title"
          className="text-[14px] uppercase tracking-[0.16em] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
        >
          Edit dose
        </h2>

        <label className="mt-4 block">
          <span
            className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Amount (mL)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onBlur={() => {
              const parsed = parseFloat(amountStr)
              if (Number.isFinite(parsed)) {
                setAmountStr(snapDoseToStep(parsed).toFixed(2))
              }
            }}
            className="mt-1 h-12 w-full rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-3 text-[var(--app-text)] outline-none focus:border-[var(--color-ring)]"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </label>

        <label className="mt-3 block">
          <span
            className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Substance
          </span>
          <select
            value={substance}
            onChange={(e) => setSubstance(e.target.value as DoseSubstance)}
            className="mt-1 h-12 w-full rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-3 text-[var(--app-text)] outline-none focus:border-[var(--color-ring)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {VALID_DOSE_SUBSTANCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block">
          <span
            className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Date & time
          </span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="mt-1 h-12 w-full rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-3 text-[var(--app-text)] outline-none focus:border-[var(--color-ring)]"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </label>

        {error != null && (
          <p
            className="mt-3 text-[12px] text-[var(--color-action)]"
            style={{ fontFamily: 'var(--font-body)' }}
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-[14px] border border-[var(--app-divider)] text-[var(--app-dim)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-12 flex-1 rounded-[14px] bg-[var(--color-action)] text-[var(--app-text)] outline-none transition-opacity duration-[150ms] hover:opacity-90"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}
