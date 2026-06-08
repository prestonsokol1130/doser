import { useCallback, useEffect, useRef, useState } from 'react'
import type { CarouselCardData } from './carouselTypes'
import { CurrentStateCard } from './CurrentStateCard'
import { ForecastCard } from './ForecastCard'
import { Past12HoursCard } from './Past12HoursCard'
import { SessionCompareCard } from './SessionCompareCard'
import { TimerRingCard } from './TimerRingCard'
import { TodayCard } from './TodayCard'

export const CAROUSEL_CARD_COUNT = 6

const FACE_ANGLE = 360 / CAROUSEL_CARD_COUNT
const CUBE_TRANSITION_MS = 350

type TimerCarouselProps = CarouselCardData & {
  activeIndex: number
  onActiveIndexChange: (index: number) => void
}

export function TimerCarousel({
  activeIndex,
  onActiveIndexChange,
  ...cardData
}: TimerCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const [depthPx, setDepthPx] = useState(280)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      if (w > 0) {
        const radius = w / (2 * Math.tan(Math.PI / CAROUSEL_CARD_COUNT))
        setDepthPx(Math.round(radius))
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(CAROUSEL_CARD_COUNT - 1, index))
      onActiveIndexChange(clamped)
    },
    [onActiveIndexChange],
  )

  const cards = [
    <TimerRingCard key="ring" timer={cardData.timer} />,
    <TodayCard key="today" {...cardData} />,
    <CurrentStateCard key="state" {...cardData} />,
    <Past12HoursCard key="past" {...cardData} />,
    <ForecastCard key="forecast" {...cardData} />,
    <SessionCompareCard key="compare" {...cardData} />,
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ perspective: '1000px' }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? 0
        }}
        onTouchEnd={(e) => {
          const endX = e.changedTouches[0]?.clientX ?? 0
          const delta = endX - touchStartX.current
          if (Math.abs(delta) > 40) {
            scrollToIndex(activeIndex + (delta < 0 ? 1 : -1))
          }
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${-activeIndex * FACE_ANGLE}deg)`,
            transition: `transform ${CUBE_TRANSITION_MS}ms var(--ease-in-out)`,
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="absolute inset-0 h-full w-full"
              style={{
                transform: `rotateY(${i * FACE_ANGLE}deg) translateZ(${depthPx}px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                pointerEvents: i === activeIndex ? 'auto' : 'none',
              }}
              aria-hidden={i !== activeIndex}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PaginationDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 py-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to card ${i + 1}`}
          aria-current={i === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(i)}
          className={`h-2.5 w-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-bg)] ${
            i === activeIndex
              ? 'bg-[var(--color-ring)]'
              : 'bg-[rgba(255,255,255,0.25)]'
          }`}
        />
      ))}
    </div>
  )
}
