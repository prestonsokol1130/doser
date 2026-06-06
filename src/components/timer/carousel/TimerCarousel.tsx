import { useCallback, useEffect, useRef, type ReactNode } from 'react'

type CarouselCardShellProps = {
  children: ReactNode
  className?: string
}

export function CarouselCardShell({
  children,
  className = '',
}: CarouselCardShellProps) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 ${className}`}
    >
      {children}
    </div>
  )
}

type TimerCarouselProps = {
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onScrollToReady?: (scrollTo: (index: number) => void) => void
  children: ReactNode[]
}

const CARD_COUNT = 6

export function TimerCarousel({
  onActiveIndexChange,
  onScrollToReady,
  children,
}: TimerCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; scrollLeft: number; dragging: boolean }>({
    startX: 0,
    scrollLeft: 0,
    dragging: false,
  })

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const width = el.clientWidth
    if (width <= 0) return
    const index = Math.round(el.scrollLeft / width)
    onActiveIndexChange(Math.min(CARD_COUNT - 1, Math.max(0, index)))
  }, [onActiveIndexChange])

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.min(CARD_COUNT - 1, Math.max(0, index))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
      onActiveIndexChange(clamped)
    },
    [onActiveIndexChange],
  )

  useEffect(() => {
    onScrollToReady?.(scrollToIndex)
  }, [onScrollToReady, scrollToIndex])

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el) return
    dragRef.current = {
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      dragging: true,
    }
    el.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return
    const el = scrollRef.current
    if (!el) return
    const delta = event.clientX - dragRef.current.startX
    el.scrollLeft = dragRef.current.scrollLeft - delta
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el) return
    dragRef.current.dragging = false
    el.releasePointerCapture(event.pointerId)
    syncIndexFromScroll()
  }

  return (
    <div
      ref={scrollRef}
      className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onScroll={syncIndexFromScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children.map((child, index) => (
        <div key={index} className="w-full shrink-0 snap-center snap-always">
          {child}
        </div>
      ))}
    </div>
  )
}

export function CarouselDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <div className="mt-5 flex justify-center gap-5">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to card ${index + 1}`}
          aria-current={index === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={`h-3 w-3 rounded-full transition-colors ${
            index === activeIndex
              ? 'bg-[var(--color-accent)]'
              : 'bg-white/25'
          }`}
        />
      ))}
    </div>
  )
}
