"use client";

import { useRouter } from "next/navigation";

export function DatePicker({ day, min, max, label }: { day: string; min: string; max: string; label: string }) {
  const router = useRouter();
  return (
    <label className="relative cursor-pointer text-2xl font-semibold sm:text-3xl">
      {label}
      <input
        type="date"
        value={day}
        min={min}
        max={max}
        onChange={(event) => event.target.value && router.push(`/?day=${event.target.value}`)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose a day"
      />
    </label>
  );
}
