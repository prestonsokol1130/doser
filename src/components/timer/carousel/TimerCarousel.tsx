import { useCallback, useRef } from 'react'
import type React from 'react'
import type { TimerState } from '../timerUtils'
import { CurrentStateCard } from './CurrentStateCard'
import { ForecastCard } from './ForecastCard'
import { Past12HoursCard } from './Past12HoursCard'
import { SessionCompareCard } from './SessionCompareCard'
import { TimerRingCard } from './TimerRingCard'
import { TodayCard } from './TodayCard'

export const CAROUSEL_CARD_COUNT = 6

type TimerCarouselProps = {
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  timer: TimerState
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export function TimerCarousel({
  activeIndex,
  onActiveIndexChange,
  timer,
  scrollRef,
}: TimerCarouselProps) {
  const touchStartX = useRef(0)

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(CAROUSEL_CARD_COUNT - 1, index))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
      onActiveIndexChange(clamped)
    },
    [scrollRef, onActiveIndexChange],
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const index = Math.max(
      0,
      Math.min(
        CAROUSEL_CARD_COUNT - 1,
        Math.round(el.scrollLeft / el.clientWidth),
      ),
    )
    if (index !== activeIndex) {
      onActiveIndexChange(index)
    }
  }, [scrollRef, activeIndex, onActiveIndexChange])

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
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
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <TimerRingCard timer={timer} />
        </div>
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <TodayCard />
        </div>
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <CurrentStateCard />
        </div>
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <Past12HoursCard />
        </div>
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <ForecastCard />
        </div>
        <div className="flex h-full min-h-0 w-full shrink-0 snap-center snap-always">
          <SessionCompareCard />
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
