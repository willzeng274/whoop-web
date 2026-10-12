import { palette } from "@/lib/format";

type Ring = { value?: number; max: number; color: string };

/** Strain outside, recovery in the middle, sleep inside: the app's hero rings. */
export function Rings({ rings }: { rings: Ring[] }) {
  const size = 220;
  const stroke = 22;
  const gap = 6;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
      {rings.map((ring, index) => {
        const radius = size / 2 - stroke / 2 - index * (stroke + gap);
        const circumference = 2 * Math.PI * radius;
        const fraction = Math.min(Math.max((ring.value ?? 0) / ring.max, 0), 1);
        return (
          <g key={index}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ring.color} strokeOpacity={0.18} strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ring.color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={`${circumference * fraction} ${circumference}`}
            />
          </g>
        );
      })}
    </svg>
  );
}

type Bar = { key: string; value?: number };

/** Daily bars with an average guide; the selected day is fully opaque. */
export function Bars({
  bars, color, selected, height = 90,
}: { bars: Bar[]; color: (value?: number) => string; selected?: string; height?: number }) {
  const values = bars.map((bar) => bar.value).filter((v): v is number => v != null);
  const max = Math.max(...values, 1);
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
  const width = 100 / Math.max(bars.length, 1);
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      {bars.map((bar, index) =>
        bar.value == null ? null : (
          <rect
            key={bar.key}
            x={index * width + width * 0.15}
            width={width * 0.7}
            y={height - (bar.value / max) * height}
            height={(bar.value / max) * height}
            rx={Math.min(width * 0.3, 1.2)}
            fill={color(bar.value)}
            opacity={selected && bar.key !== selected ? 0.55 : 1}
          />
        ),
      )}
      {average != null && (
        <line x1={0} x2={100} y1={height - (average / max) * height} y2={height - (average / max) * height}
          stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.8} />
      )}
    </svg>
  );
}

/** Zone 5 first, like the app's breakdown. */
export function ZoneBreakdown({ percents, seconds }: { percents: number[]; seconds?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {[4, 3, 2, 1, 0].map((zone) => {
        const percent = percents[zone] ?? 0;
        const minutes = seconds ? Math.round((seconds * percent) / 100 / 60) : undefined;
        return (
          <div key={zone} className="flex items-center gap-3">
            <span className="w-14 text-sm text-neutral-400">Zone {zone + 1}</span>
            <div className="h-2 flex-1 rounded-full bg-neutral-800">
              <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: palette.zones[zone] }} />
            </div>
            <span className="w-12 text-right text-sm tabular-nums">{Math.round(percent)}%</span>
            {minutes != null && <span className="w-14 text-right text-sm tabular-nums text-neutral-400">{minutes}m</span>}
          </div>
        );
      })}
    </div>
  );
}
