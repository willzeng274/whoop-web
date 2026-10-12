export const TIME_ZONE = process.env.WHOOP_TIME_ZONE ?? "America/Toronto";

/** Request time; pages are rendered per request so this is stable within one render. */
export function requestTime(): number {
  return Date.now();
}

export const palette = {
  surface: "#1c1c1e",
  guide: "#363636",
  muted: "#8e8e93",
  sleep: "#63b0ff",
  duration: "#64d2ff",
  strain: "#0a84ff",
  steps: "#a38fdb",
  rhr: "#ff453a",
  hrv: "#30d5c8",
  zones: ["#8c99ad", "#4599ff", "#33cc73", "#ff9e1a", "#ff404d"],
};

export function recoveryColor(value?: number): string {
  if (value == null) return palette.muted;
  if (value < 34) return "#ff0026";
  if (value < 67) return "#ffde00";
  return "#16ec06";
}

export type MetricKey = "recovery" | "sleep" | "strain" | "steps" | "duration" | "rhr" | "hrv";

export type Metric = {
  key: MetricKey;
  title: string;
  unit?: string;
  color: (value?: number) => string;
  format: (value: number) => string;
};

const fixed = (digits: number) => (value: number) => value.toFixed(digits);

export function minutes(value: number): string {
  const total = Math.round(value);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

export const METRICS: Metric[] = [
  { key: "recovery", title: "Recovery", unit: "%", color: recoveryColor, format: fixed(0) },
  { key: "sleep", title: "Sleep", unit: "%", color: () => palette.sleep, format: fixed(0) },
  { key: "strain", title: "Strain", color: () => palette.strain, format: fixed(1) },
  { key: "steps", title: "Steps", color: () => palette.steps, format: (v) => Math.round(v).toLocaleString("en-US") },
  { key: "duration", title: "Sleep duration", color: () => palette.duration, format: minutes },
  { key: "rhr", title: "RHR", unit: "bpm", color: () => palette.rhr, format: fixed(0) },
  { key: "hrv", title: "HRV", unit: "ms", color: () => palette.hrv, format: fixed(0) },
];

export function metric(key?: string): Metric | undefined {
  return METRICS.find((m) => m.key === key);
}

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function dayKey(ms: number): string {
  return dayFormatter.format(new Date(ms));
}

export function shiftDay(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function longDate(key: string): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export function shortDate(key: string): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
}

export function ago(ms: number, now: number): string {
  const mins = Math.max(0, Math.round((now - ms) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
