/** Display helpers for PEL — does not duplicate engine math. */

export function perceivedEffectLabel(percent: number): string {
  const p = Math.max(0, Math.min(100, percent))
  if (p < 8) return 'None'
  if (p < 32) return 'Low'
  if (p < 58) return 'Moderate'
  if (p < 82) return 'High'
  return 'Very high'
}

export function perceivedEffectTrendLabel(prev: number, next: number): string {
  const delta = next - prev
  if (Math.abs(delta) < 2) return 'Steady'
  if (delta > 0) return 'Rising'
  return 'Falling'
}

/** Interpolate red (0%) → yellow (50%) → green (100%) using design tokens only. */
export function pelGaugeColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent)) / 100
  if (p <= 0.5) {
    const t = p / 0.5
    return `color-mix(in srgb, var(--color-action) ${Math.round((1 - t) * 100)}%, var(--color-ring) ${Math.round(t * 100)}%)`
  }
  return 'var(--color-ring)'
}

export function pelGaugeTrackColor(percent: number): string {
  return `color-mix(in srgb, ${pelGaugeColor(percent)} 28%, transparent)`
}
