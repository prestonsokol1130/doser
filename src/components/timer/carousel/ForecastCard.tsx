import { CarouselCardShell } from './CarouselCardShell'

const PLACEHOLDER = {
  atNextWindow: 'Moderate',
}

export function ForecastCard() {
  return (
    <CarouselCardShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
            FORECAST
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-purple)]">
            PREDICTED LEVEL
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            At Next Window
          </p>
          <p className="mt-1 text-base text-[var(--color-text)]">
            {PLACEHOLDER.atNextWindow}
          </p>
        </div>
      </div>

      <div className="relative mt-6 h-[clamp(10rem,40vw,14rem)] w-full">
        <div className="absolute inset-y-4 left-0 flex flex-col justify-between text-xs text-[var(--color-text-muted)]">
          <span>High</span>
          <span>Moderate</span>
          <span>Low</span>
          <span>None</span>
        </div>

        <svg
          viewBox="0 0 280 140"
          className="ml-8 h-full w-[calc(100%-2rem)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d="M 0 120 C 40 118, 60 90, 90 70 S 150 20, 180 35 S 230 80, 280 95 L 280 140 L 0 140 Z"
            fill="url(#forecastFill)"
          />
          <path
            d="M 0 120 C 40 118, 60 90, 90 70 S 150 20, 180 35 S 230 80, 280 95"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute inset-x-8 bottom-0 flex justify-between text-xs uppercase text-[var(--color-text-muted)]">
          <span>Now</span>
          <span>Next Window</span>
        </div>
      </div>
    </CarouselCardShell>
  )
}
