"use client";

import { useEffect, useState, useTransition } from "react";

import { unlock } from "@/app/login/actions";

const KEYS: [string, string][] = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
];
const LENGTH = 4;

export function Passcode() {
  const [code, setCode] = useState("");
  const [misses, setMisses] = useState(0);
  const [locked, setLocked] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(value: string) {
    startTransition(async () => {
      const result = await unlock(value);
      if (result === "locked") setLocked(true);
      setMisses((n) => n + 1);
      setCode("");
    });
  }

  function press(digit: string) {
    if (pending || locked || code.length >= LENGTH) return;
    const next = code + digit;
    setCode(next);
    if (next.length === LENGTH) submit(next);
  }

  function remove() {
    if (!pending) setCode((c) => c.slice(0, -1));
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === "Backspace") remove();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const key = "flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full bg-[#1c1c1e] transition-colors active:bg-[#3a3a3c] select-none";

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-xl">{locked ? "Try again tomorrow" : "Enter Passcode"}</h1>
        <div key={misses} className={`flex gap-6 ${misses ? "animate-shake" : ""}`}>
          {Array.from({ length: LENGTH }, (_, index) => (
            <span key={index}
              className={`h-3.5 w-3.5 rounded-full border border-white ${index < code.length ? "bg-white" : ""}`} />
          ))}
        </div>
      </div>
      <div className={`grid grid-cols-3 gap-x-6 gap-y-4 transition-opacity ${locked ? "pointer-events-none opacity-30" : ""}`}>
        {KEYS.map(([digit, letters]) => (
          <button key={digit} type="button" className={key} onClick={() => press(digit)}>
            <span className="text-3xl leading-none">{digit}</span>
            <span className="h-3 text-[10px] font-semibold tracking-[0.2em] text-neutral-300">{letters}</span>
          </button>
        ))}
        <span />
        <button type="button" className={key} onClick={() => press("0")}>
          <span className="text-3xl leading-none">0</span>
          <span className="h-3" />
        </button>
        <button type="button" onClick={remove}
          className={`text-base transition-opacity ${code ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          Delete
        </button>
      </div>
    </div>
  );
}
