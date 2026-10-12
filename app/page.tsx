import Link from "next/link";

import { Bars, Rings, ZoneBreakdown } from "@/components/charts";
import { DatePicker } from "@/components/DatePicker";
import { loadDashboard, type Activity, type Day } from "@/lib/data";
import {
  ago, clock, dayKey, longDate, METRICS, metric, palette, recoveryColor, requestTime, shiftDay, shortDate,
  type Metric,
} from "@/lib/format";

type Search = { day?: string; metric?: string; activity?: string };

function href(params: Search): string {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const text = query.toString();
  return text ? `/?${text}` : "/";
}

function range(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftDay(end, index - count + 1));
}

function Value({ m, value, className }: { m: Metric; value?: number; className?: string }) {
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {value == null ? "–" : m.format(value)}
      {value != null && m.unit && <span className="ml-0.5 text-[0.6em] text-neutral-400">{m.unit}</span>}
    </span>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { days, activities, status } = await loadDashboard();
  const now = requestTime();
  const today = dayKey(now);
  const first = days[0]?.day ?? today;
  const selected = params.day && params.day >= first && params.day <= today ? params.day : today;
  // Days without an official strain fall back to their hardest logged activity, like the app.
  const activityStrain = new Map<string, number>();
  for (const a of activities) {
    if (a.strain == null || a.kind === "sleep" || a.kind === "nap") continue;
    const key = dayKey(a.start);
    activityStrain.set(key, Math.max(activityStrain.get(key) ?? 0, a.strain));
  }
  const byDay = new Map<string, Day>(
    days.map((d) => [d.day, { ...d, strain: d.strain ?? activityStrain.get(d.day) }]),
  );
  const current = byDay.get(selected);
  const focus = metric(params.metric);

  const dayActivities = activities
    .filter((a) => dayKey(a.start) === selected)
    .sort((a, b) => a.start - b.start);
  const live = dayActivities.some((a) => a.end == null);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={href({ ...params, day: shiftDay(selected, -1), activity: undefined })}
            className="rounded-full bg-[#1c1c1e] px-3 py-1 text-lg" aria-label="Previous day">‹</Link>
          <DatePicker day={selected} min={first} max={today}
            label={selected === today ? "Today" : longDate(selected)} />
          {selected < today && (
            <Link href={href({ ...params, day: shiftDay(selected, 1), activity: undefined })}
              className="rounded-full bg-[#1c1c1e] px-3 py-1 text-lg" aria-label="Next day">›</Link>
          )}
        </div>
        {status && (
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <span className="h-2 w-2 rounded-full"
              style={{ background: status.connected ? recoveryColor(100) : palette.muted }} />
            {status.battery != null && <span className="tabular-nums">{Math.round(status.battery)}%</span>}
            <span>{ago(status.syncedAt, now)}</span>
          </div>
        )}
      </header>

      {focus ? (
        <History focus={focus} days={byDay} selected={selected} params={params} />
      ) : (
        <>
          <section className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
            <div className="h-52 w-52">
              <Rings rings={[
                { value: current?.strain, max: 21, color: palette.strain },
                { value: current?.recovery, max: 100, color: recoveryColor(current?.recovery) },
                { value: current?.sleep, max: 100, color: palette.sleep },
              ]} />
            </div>
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-1 sm:gap-4">
              {(["strain", "recovery", "sleep"] as const).map((key) => {
                const m = metric(key)!;
                return (
                  <Link key={key} href={href({ day: selected, metric: key })} className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-neutral-400">
                      {m.title}{key === "strain" && selected === today && live ? " · live" : ""}
                    </span>
                    <Value m={m} value={current?.[key]} className="text-3xl font-semibold" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {METRICS.filter((m) => !["strain", "recovery", "sleep"].includes(m.key)).map((m) => (
              <Link key={m.key} href={href({ day: selected, metric: m.key })}
                className="flex flex-col gap-2 rounded-2xl bg-[#1c1c1e] p-4">
                <span className="text-xs uppercase tracking-wide text-neutral-400">{m.title}</span>
                <Value m={m} value={current?.[m.key]} className="text-xl font-semibold" />
                <Bars height={36} color={m.color} selected={selected}
                  bars={range(selected, 14).map((key) => ({ key, value: byDay.get(key)?.[m.key] }))} />
              </Link>
            ))}
          </section>

          <Activities items={dayActivities} params={params} selected={selected} now={now} />
        </>
      )}
    </main>
  );
}

function History({ focus, days, selected, params }: {
  focus: Metric; days: Map<string, Day>; selected: string; params: Search;
}) {
  const keys = range(selected, 30);
  const values = keys.map((key) => days.get(key)?.[focus.key]).filter((v): v is number => v != null);
  const max = Math.max(...values, 1);
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Link href={href({ day: params.day })} className="text-neutral-400">‹ Back</Link>
        <div className="flex gap-2 overflow-x-auto">
          {METRICS.map((m) => (
            <Link key={m.key} href={href({ day: params.day, metric: m.key })}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                m.key === focus.key ? "bg-white text-black" : "bg-[#1c1c1e] text-neutral-300"}`}>
              {m.title}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-neutral-400">{longDate(selected)}</span>
          <Value m={focus} value={days.get(selected)?.[focus.key]} className="text-4xl font-semibold" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-neutral-400">30-day avg</span>
          <Value m={focus} value={average} className="text-xl" />
        </div>
      </div>
      <div className="rounded-2xl bg-[#1c1c1e] p-4">
        <div className="flex h-40 items-end gap-[2px]">
          {keys.map((key) => {
            const value = days.get(key)?.[focus.key];
            return (
              <Link key={key} href={href({ day: key, metric: focus.key })} title={shortDate(key)}
                className="flex h-full flex-1 items-end">
                <div className="w-full rounded-sm" style={{
                  height: value == null ? 0 : `${(value / max) * 100}%`,
                  background: focus.color(value),
                  opacity: key === selected ? 1 : 0.55,
                }} />
              </Link>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-neutral-500">
          <span>{shortDate(keys[0])}</span>
          <span>{shortDate(keys[keys.length - 1])}</span>
        </div>
      </div>
    </section>
  );
}

function Activities({ items, params, selected, now }: {
  items: Activity[]; params: Search; selected: string; now: number;
}) {
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2">
      {items.map((a) => {
        const open = params.activity === a.entryId;
        const end = a.end ?? now;
        const minutes = Math.round((end - a.start) / 60000);
        const isSleep = a.kind === "sleep" || a.kind === "nap";
        return (
          <div key={a.entryId} className="rounded-2xl bg-[#1c1c1e]">
            <Link href={href({ day: selected, activity: open ? undefined : a.entryId })}
              className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="w-12 text-center text-lg font-semibold tabular-nums"
                  style={{ color: isSleep ? palette.sleep : palette.strain }}>
                  {isSleep ? (a.sleepScore != null ? `${Math.round(a.sleepScore)}%` : "–")
                    : a.strain != null ? a.strain.toFixed(1) : "–"}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-sm text-neutral-400">
                    {clock(a.start)} – {a.end ? clock(a.end) : "now"} · {Math.floor(minutes / 60)}h {minutes % 60}m
                  </span>
                </div>
              </div>
              {a.averageHeartRate != null && (
                <span className="text-sm tabular-nums text-neutral-400">{Math.round(a.averageHeartRate)} bpm</span>
              )}
            </Link>
            {open && (
              <div className="flex flex-col gap-4 border-t border-neutral-800 p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {([
                    ["Avg HR", a.averageHeartRate],
                    ["Max HR", a.maxHeartRate],
                    ["Calories", a.calories],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs uppercase text-neutral-400">{label}</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {value == null ? "–" : Math.round(value)}
                      </span>
                    </div>
                  ))}
                </div>
                {a.zonePercents?.length ? (
                  <ZoneBreakdown percents={a.zonePercents} seconds={(end - a.start) / 1000} />
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
