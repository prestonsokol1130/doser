import { useEffect, useMemo, useState } from 'react'
import {
  buildInsightSet,
  fmtMin,
  pctChange,
  type InsightFilter,
  type InsightSet,
  type TrendDir,
} from '@/lib/insightsData'
import type { Dose, Profile } from '@/types'

type InsightsScreenProps = {
  doses: Dose[]
  profile: Profile
  nowMs: number
}

type Tab = InsightFilter | 'peer'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Subtle mount reveal (replaces the v0 framer-motion entrance). Flips true one
// frame after mount so CSS transitions animate bars/gauges in from zero.
function useReveal(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return on
}

// ─── card shell ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-1 pt-2 text-[10px] uppercase tracking-[0.24em] text-[var(--app-faint)]"
      style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
    >
      {children}
    </p>
  )
}

function trendColor(dir: TrendDir): string {
  return dir === 'down' ? 'var(--color-ring)' : dir === 'up' ? 'var(--color-action)' : 'var(--app-dim)'
}

function TrendPill({ dir, children }: { dir: TrendDir; children: React.ReactNode }) {
  const color = trendColor(dir)
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      <span aria-hidden>{arrow}</span>
      {children}
    </span>
  )
}

function InsightCard({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
      <p
        className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-load)]"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
      >
        {eyebrow}
      </p>
      <h3
        className="mt-1 text-[16px] text-[var(--app-text)]"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
      >
        {title}
      </h3>
      {hint && (
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
          {hint}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

// ─── viz primitives ─────────────────────────────────────────────────────────────

function BigStat({ value, unit, caption }: { value: string | number; unit?: string; caption?: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[52px] leading-none text-[var(--app-text)] tabular-nums"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[16px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>
      {caption && (
        <span className="mt-2 text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
          {caption}
        </span>
      )}
    </div>
  )
}

function RadialGauge({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const on = useReveal()
  const size = 128, stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const arc = c * 0.75 // 270deg
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--app-divider)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-ring)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - arc * (on ? value : 0)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>
          {label}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
          {sublabel}
        </span>
      </div>
    </div>
  )
}

function SegmentedBar({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const on = useReveal()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--app-bg)]">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              width: on ? `${s.value * 100}%` : '0%',
              backgroundColor: s.color,
              transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[12px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
              {s.label}
            </span>
            <span className="text-[12px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              {Math.round(s.value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBars({ data, labels, highlight, color }: { data: number[]; labels: string[]; highlight: number; color: string }) {
  const on = useReveal()
  const max = Math.max(...data, 0.0001)
  return (
    <div className="flex h-28 items-end justify-between gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-[3px]"
              style={{
                height: on ? `${(d / max) * 100}%` : '0%',
                backgroundColor: i === highlight ? color : 'var(--app-faint)',
                transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s`,
              }}
            />
          </div>
          <span className="text-[10px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  )
}

function DotMatrix({ data, cols = 10 }: { data: number[]; cols?: number }) {
  const on = useReveal()
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="aspect-square w-full rounded-[3px]"
          style={{
            backgroundColor: v > 0.12 ? 'var(--color-ring)' : 'var(--app-faint)',
            opacity: on ? (v > 0.12 ? 0.35 + v * 0.65 : 0.5) : 0,
            transition: `opacity 0.35s ease ${i * 0.012}s`,
          }}
        />
      ))}
    </div>
  )
}

function IntervalLadder({ gaps, preferred }: { gaps: number[]; preferred: number }) {
  const on = useReveal()
  const max = Math.max(...gaps, preferred) * 1.1 || 1
  return (
    <div className="flex flex-col gap-1.5">
      {gaps.map((g, i) => {
        const ok = g >= preferred * 0.85
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: on ? `${(g / max) * 100}%` : '0%',
                backgroundColor: ok ? 'var(--color-ring)' : 'var(--color-action)',
                transition: `width 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
              }}
            />
            <span className="text-[10px] text-[var(--app-dim)] tabular-nums" style={{ fontFamily: 'var(--font-body)' }}>
              {g}m
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SessionShape({ shape, color }: { shape: number[]; color: string }) {
  const w = 100, h = 40
  const step = shape.length > 1 ? w / (shape.length - 1) : w
  const pts = shape.map((v, i) => [i * step, h - v * h] as const)
  const line = pts.map((p) => `${p[0]},${p[1]}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity={0.16} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrendLine({ data, color }: { data: number[]; color: string }) {
  const w = 100, h = 36
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const step = data.length > 1 ? w / (data.length - 1) : w
  const line = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none">
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DensityBand({ data }: { data: number[] }) {
  const on = useReveal()
  return (
    <div className="flex h-10 w-full gap-px overflow-hidden rounded-[6px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="h-full flex-1"
          style={{
            backgroundColor: 'var(--color-ring)',
            opacity: on ? 0.12 + v * 0.88 : 0,
            transition: `opacity 0.5s ease ${i * 0.015}s`,
          }}
        />
      ))}
    </div>
  )
}

function ComparisonBars({ now, prev, unit, nowLabel, prevLabel }: { now: number; prev: number; unit: string; nowLabel: string; prevLabel: string }) {
  const on = useReveal()
  const max = Math.max(now, prev) || 1
  const rows = [
    { label: nowLabel, value: now, color: 'var(--color-ring)' },
    { label: prevLabel, value: prev, color: 'var(--app-faint)' },
  ]
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
            <span className="text-[var(--app-dim)]">{r.label}</span>
            <span className="text-[var(--app-text)] tabular-nums" style={{ fontWeight: 600 }}>{r.value}{unit}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--app-bg)]">
            <div
              className="h-full rounded-full"
              style={{ width: on ? `${(r.value / max) * 100}%` : '0%', backgroundColor: r.color, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WeightedBars({ items, color }: { items: { label: string; weight: number }[]; color: string }) {
  const on = useReveal()
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Not enough data yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-body)' }}>{it.label}</span>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-bg)]">
            <div className="h-full rounded-full" style={{ width: on ? `${it.weight * 100}%` : '0%', backgroundColor: color, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Metric({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div className="flex flex-col rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-3">
      <span className="text-[24px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>
        {value}
        {unit && <span className="ml-0.5 text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>{unit}</span>}
      </span>
      <span className="mt-1 text-[11px] leading-tight text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
    </div>
  )
}

// ─── card stream ────────────────────────────────────────────────────────────────

function toleranceCopy(dir: TrendDir): string {
  if (dir === 'down') return 'Sensitivity appears to be recovering.'
  if (dir === 'up') return 'Effect per mL is trending lower over time.'
  return 'Holding steady across the recent window.'
}
function buildCopy(label: InsightSet['buildLabel']): string {
  if (label === 'Tapers') return 'Doses usually get smaller as a session goes on.'
  if (label === 'Escalates') return 'Doses tend to grow as a session goes on — worth watching.'
  return 'Dose size usually stays level across a session.'
}

function InsightStream({ data, filter }: { data: InsightSet; filter: InsightFilter }) {
  const use30Change = pctChange(data.last30Ml, data.prev30Ml)
  const sessionsChange = pctChange(data.sessions30, data.prevSessions30)
  const spacingChange = pctChange(data.avgSpacing, data.prevAvgSpacing)
  const doseChange = pctChange(data.avgDose, data.prevAvgDose)
  const busiestDow = data.dayOfWeek.indexOf(Math.max(...data.dayOfWeek))
  const peakHour = data.timeOfDay.indexOf(Math.max(...data.timeOfDay))
  const accent = filter === 'bdo' ? 'var(--color-load)' : 'var(--color-ring)'
  const substanceLabel = filter === 'gbl' ? 'GBL' : filter === 'bdo' ? 'BDO' : 'All substances'

  return (
    <div className="flex flex-col gap-4 pb-2">
      <SectionLabel>Overview</SectionLabel>

      <InsightCard
        eyebrow={`${substanceLabel} · Last 30 days`}
        title="30-Day Volume"
        hint="Total intake over the last 30 days, grouped into sessions by spacing gaps."
      >
        <div className="flex items-end justify-between gap-4">
          <BigStat value={data.last30Ml} unit="mL" />
          <div className="text-right">
            <TrendPill dir={use30Change <= 0 ? 'down' : 'up'}>
              {use30Change > 0 ? '+' : ''}{use30Change}% vs prior 30d
            </TrendPill>
            <div className="mt-3 flex items-center justify-end gap-4">
              <div className="flex flex-col items-start">
                <span className="text-[24px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>{data.sessions30}</span>
                <span className="text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Sessions</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[24px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>{data.activeDays30}</span>
                <span className="text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Active days</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <ComparisonBars now={data.last30Ml} prev={data.prev30Ml} unit="mL" nowLabel="Last 30 days" prevLabel="Prior 30 days" />
        </div>
      </InsightCard>

      <InsightCard eyebrow="Last 30 days" title="30-Day Sessions" hint="How many distinct sessions you logged, compared with the previous 30 days.">
        <div className="flex items-end justify-between gap-4">
          <BigStat value={data.sessions30} caption={`${(data.sessions30 / 4.3).toFixed(1)} per week on average`} />
          <div className="text-right">
            <TrendPill dir={sessionsChange <= 0 ? 'down' : 'up'}>{sessionsChange > 0 ? '+' : ''}{sessionsChange}% vs prior 30d</TrendPill>
            <p className="mt-2 text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>{data.prevSessions30} previously</p>
          </div>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Last 7 days" title="This Week">
        <div className="grid grid-cols-3 gap-3">
          <Metric value={data.last7Ml} unit="mL" label="Volume" />
          <Metric value={data.sessions7} label="Sessions" />
          <Metric value={data.avgDosesPerSession.toFixed(1)} label="Doses / session" />
        </div>
      </InsightCard>

      <SectionLabel>What&apos;s Typical</SectionLabel>

      <InsightCard eyebrow="Your Normal" title="A Typical Session" hint="Median values, so one unusually heavy night doesn't skew the picture.">
        <div className="grid grid-cols-3 gap-3">
          <Metric value={data.medianSessionTotal} unit="mL" label="Usual total" />
          <Metric value={fmtMin(data.medianSessionLen)} label="Usual length" />
          <Metric value={data.medianDosesPerSession} label="Usual doses" />
        </div>
      </InsightCard>

      <InsightCard eyebrow="Dose & Spacing" title="Typical Dose & Spacing" hint="What a normal pour looks like, and how long you usually leave between doses within a session.">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <BigStat value={data.medianDose} unit="mL" />
            <span className="mt-2 text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Typical dose size</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[40px] leading-none text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>{fmtMin(data.medianSpacing)}</span>
            <span className="mt-2 text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Usual gap between doses</span>
          </div>
        </div>
      </InsightCard>

      <SectionLabel>Spacing &amp; Redose</SectionLabel>

      <InsightCard eyebrow="Redose Timing" title="Too Soon · Borderline · Well-Spaced" hint="Share of redoses that fell too soon, borderline, or comfortably within your preferred interval.">
        <SegmentedBar
          segments={[
            { value: data.wellSpaced, color: 'var(--color-ring)', label: 'Well-spaced' },
            { value: data.borderline, color: 'var(--color-load)', label: 'Borderline' },
            { value: data.tooSoon, color: 'var(--color-action)', label: 'Too soon' },
          ]}
        />
      </InsightCard>

      <InsightCard eyebrow="Spacing vs Target" title="Recent Interval Ladder" hint={`Preferred interval for ${substanceLabel}: ${fmtMin(data.preferredInterval)}. Bars in orange came in under that window.`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[34px] leading-none text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>{fmtMin(data.avgSpacing)}</span>
            <span className="text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Average spacing</span>
          </div>
          <TrendPill dir={spacingChange >= 0 ? 'down' : 'up'}>{spacingChange > 0 ? '+' : ''}{spacingChange}% vs prior</TrendPill>
        </div>
        {data.spacingLadder.length > 0 ? (
          <IntervalLadder gaps={data.spacingLadder} preferred={data.preferredInterval} />
        ) : (
          <p className="text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>No in-session redoses logged yet.</p>
        )}
      </InsightCard>

      <SectionLabel>Session Shape</SectionLabel>

      <InsightCard eyebrow="Session Shape" title="Typical Session Arc" hint="Relative dose size by position within a session. A downward slope suggests tapering; a flat or rising arc suggests escalation.">
        <div className="flex flex-col gap-4">
          {data.sessionShapes.length > 0 ? (
            data.sessionShapes.map((s, i) => <SessionShape key={i} shape={s} color={accent} />)
          ) : (
            <SessionShape shape={data.escalation} color={accent} />
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { v: fmtMin(data.avgSessionLen), l: 'Avg length' },
            { v: `${data.avgSessionTotal}mL`, l: 'Avg total' },
            { v: data.avgDosesPerSession.toFixed(1), l: 'Avg doses' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col">
              <span className="text-[16px] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{s.v}</span>
              <span className="text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </InsightCard>

      <InsightCard eyebrow="Session Build Pattern" title="How Sessions Usually Build" hint={buildCopy(data.buildLabel)}>
        <div className="mb-4">
          <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: accent, color: '#000', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Mostly {data.buildLabel.toLowerCase()}
          </span>
        </div>
        <SegmentedBar
          segments={[
            { value: data.buildPattern.tapers, color: 'var(--color-ring)', label: 'Tapers' },
            { value: data.buildPattern.flat, color: 'var(--color-load)', label: 'Flat' },
            { value: data.buildPattern.escalates, color: 'var(--color-action)', label: 'Escalates' },
          ]}
        />
      </InsightCard>

      <InsightCard eyebrow="Tolerance Direction" title="Sensitivity Trend" hint={toleranceCopy(data.toleranceDir)}>
        <div className="flex items-center justify-between gap-4">
          <RadialGauge value={data.toleranceConfidence} label={`${Math.round(data.toleranceConfidence * 100)}%`} sublabel="Confidence" />
          <div className="flex flex-col gap-2">
            <TrendPill dir={data.toleranceDir}>
              {data.toleranceDir === 'down' ? 'Easing' : data.toleranceDir === 'up' ? 'Rising' : 'Stable'}
            </TrendPill>
            <p className="max-w-[150px] text-[13px] leading-relaxed text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
              Modeled from dose size, spacing, and perceived effect over recent sessions.
            </p>
          </div>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Tolerance Drivers" title="What's Moving It" hint="The factors contributing most to the current direction of tolerance pressure.">
        <WeightedBars items={data.toleranceDrivers} color={accent} />
      </InsightCard>

      <SectionLabel>Rhythm</SectionLabel>

      <InsightCard eyebrow="Preferred Start Window" title="When Sessions Begin" hint={`Most sessions begin around ${data.mostCommonStart}, typically running ${data.typicalWindow}.`}>
        <DensityBand data={data.timeOfDay} />
        <div className="mt-2 flex justify-between text-[10px] text-[var(--app-dim)] tabular-nums" style={{ fontFamily: 'var(--font-body)' }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[11px] tabular-nums" style={{ backgroundColor: 'var(--color-ring)', color: '#000', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Peak {String(peakHour).padStart(2, '0')}:00
          </span>
          <span className="text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Most common start {data.mostCommonStart}</span>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Day-of-Week Pattern" title="Where The Week Lands" hint="Total volume by weekday helps surface which days carry most of your use.">
        <MiniBars data={data.dayOfWeek} labels={DOW} highlight={busiestDow} color="var(--color-ring)" />
      </InsightCard>

      <InsightCard eyebrow="Active Days" title="Last 30 Days" hint={`${data.activeDays30} of the last 30 days had recorded use. Brighter cells indicate heavier days.`}>
        <DotMatrix data={data.calendar} cols={10} />
      </InsightCard>

      <SectionLabel>Recovery</SectionLabel>

      <InsightCard eyebrow="Between-Session Recovery" title="Space Between Sessions" hint="Time between the end of one session and the start of the next. Longer gaps give the body more room to reset.">
        <div className="flex items-end justify-between">
          <BigStat value={data.avgRecoveryGap} unit="h" caption="Median recovery gap" />
          <div className="text-right">
            <span className="text-[28px] text-[var(--app-text)] tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}>{data.longestRecoveryGap}h</span>
            <p className="text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Longest recent</p>
          </div>
        </div>
      </InsightCard>

      <InsightCard eyebrow="Shortest Turnaround" title="Tightest Gap Logged" hint="The shortest break between two sessions in this window. Short turnarounds leave little time to reset.">
        <div className="flex items-end justify-between gap-4">
          <BigStat value={data.shortestRecoveryGap} unit="h" />
          <div className="text-right">
            <TrendPill dir={data.shortestRecoveryGap < 16 ? 'up' : 'down'}>{data.shortestRecoveryGap < 16 ? 'Tight' : 'Comfortable'}</TrendPill>
            <p className="mt-2 max-w-[150px] text-[13px] leading-relaxed text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Median sits at {data.avgRecoveryGap}h.</p>
          </div>
        </div>
      </InsightCard>

      <SectionLabel>Recent Change</SectionLabel>

      <InsightCard eyebrow="Recent Change" title="Direction Of Travel" hint="How this 30-day window compares with the one before it.">
        <div className="flex flex-col gap-4">
          {[
            { l: 'Total volume', c: use30Change, good: use30Change <= 0 },
            { l: 'Average spacing', c: spacingChange, good: spacingChange >= 0 },
            { l: 'Average dose size', c: doseChange, good: doseChange <= 0 },
          ].map((r) => (
            <div key={r.l} className="flex items-center justify-between">
              <span className="text-[14px] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-body)' }}>{r.l}</span>
              <TrendPill dir={r.good ? 'down' : 'up'}>{r.c > 0 ? '+' : ''}{r.c}%</TrendPill>
            </div>
          ))}
        </div>
      </InsightCard>

      {filter === 'all' ? (
        <InsightCard eyebrow="Share Of Use" title="Split By Substance" hint="Proportion of total volume in this window by substance.">
          <SegmentedBar
            segments={[
              { value: data.shareOfUse.gbl, color: 'var(--color-ring)', label: 'GBL' },
              { value: data.shareOfUse.bdo, color: 'var(--color-load)', label: 'BDO' },
            ]}
          />
        </InsightCard>
      ) : (
        <InsightCard
          eyebrow="Spacing Drift"
          title="Is Spacing Drifting Over Time"
          hint={filter === 'gbl' ? 'GBL patterns tend to run tighter and faster — watch for spacing compressing across a session.' : 'BDO has a slower onset and longer tail — gaps naturally run wider here.'}
        >
          {data.spacingLadder.length > 1 ? (
            <>
              <TrendLine data={data.spacingLadder} color={accent} />
              <div className="mt-3 flex justify-between text-[11px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
                <span>Earlier</span><span>Recent</span>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Not enough spacing data yet.</p>
          )}
        </InsightCard>
      )}

      <InsightCard eyebrow="All-Time Overview" title="All-Time Total">
        <div className="flex items-end justify-between">
          <BigStat value={data.lifetimeMl.toLocaleString()} unit="mL" />
          <span className="text-[13px] text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>Highest session {data.highestSessionTotal}mL</span>
        </div>
      </InsightCard>

      <p className="px-2 pt-2 text-center text-[12px] leading-relaxed text-[var(--app-faint)]" style={{ fontFamily: 'var(--font-body)' }}>
        doser surfaces patterns to support your own judgment. It is not a medical device.
      </p>
    </div>
  )
}

function PeerEmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
        <span className="h-5 w-5 rounded-full border-2 border-[var(--app-faint)]" />
      </div>
      <h2 className="text-[18px] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Peer Comparison</h2>
      <p className="max-w-[260px] text-[13px] leading-relaxed text-[var(--app-dim)]" style={{ fontFamily: 'var(--font-body)' }}>
        Anonymous, opt-in comparison against similar usage patterns is coming later. Nothing is shared and nothing is ranked.
      </p>
      <span className="rounded-full border border-[var(--app-divider)] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--app-faint)]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
        Coming later
      </span>
    </div>
  )
}

// ─── screen ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; disabled?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'gbl', label: 'GBL' },
  { id: 'bdo', label: 'BDO' },
  { id: 'peer', label: 'Peer', disabled: true },
]

export function InsightsScreen({ doses, profile, nowMs }: InsightsScreenProps) {
  const [tab, setTab] = useState<Tab>('all')

  const data = useMemo(
    () => (tab === 'peer' ? null : buildInsightSet(doses, profile, nowMs, tab)),
    [doses, profile, nowMs, tab],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[18px] uppercase tracking-[0.2em] text-[var(--app-text)]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            INSIGHTS
          </h1>
          <span className="text-[11px] text-[var(--color-load)]" style={{ fontFamily: 'var(--font-body)' }}>
            Patterns in your use
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1 rounded-[12px] bg-[var(--app-bg)] p-1">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                disabled={t.disabled}
                onClick={() => !t.disabled && setTab(t.id)}
                className="relative flex-1 rounded-[8px] px-3 py-2 text-[13px] outline-none transition-colors duration-[150ms]"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: t.disabled ? 'var(--app-faint)' : active ? '#000' : 'var(--app-dim)',
                  backgroundColor: active && !t.disabled ? 'var(--color-ring)' : 'transparent',
                  cursor: t.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {t.label}
                  {t.disabled && <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-faint)]" />}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tab === 'peer' || data == null ? (
          <PeerEmptyState />
        ) : (
          <InsightStream key={tab} data={data} filter={tab} />
        )}
      </div>
    </div>
  )
}
