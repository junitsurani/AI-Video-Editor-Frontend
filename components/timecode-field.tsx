"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { duration } from "@/lib/studio";

export function clampTime(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function splitTime(total: number, max: number) {
  const safe = clampTime(total, 0, max);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  return { hours, minutes, seconds };
}

export function joinTime(hours: number, minutes: number, seconds: number) {
  return Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60 + Math.max(0, seconds);
}

function digits(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 3);
}

function parsePart(raw: string) {
  if (raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function TimePart({
  label,
  value,
  min,
  max,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={3}
      value={draft ?? String(value)}
      disabled={disabled}
      aria-label={label}
      onFocus={() => setDraft(String(value))}
      onBlur={() => {
        onCommit(Math.min(max, Math.max(min, parsePart(draft ?? String(value)))));
        setDraft(null);
      }}
      onChange={(e) => {
        const next = digits(e.target.value);
        setDraft(next);
        if (next !== "") onCommit(Math.min(max, Math.max(min, parsePart(next))));
      }}
    />
  );
}

export function TimecodeField({
  label,
  value,
  max,
  min = 0,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  max: number;
  min?: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
}) {
  const showHours = max >= 3600;
  const { hours, minutes, seconds } = splitTime(value, max);
  function commit(nextHours: number, nextMinutes: number, nextSeconds: number) {
    onChange(clampTime(joinTime(nextHours, nextMinutes, nextSeconds), min, max));
  }
  return (
    <label className="timecode-field">
      <span className="timecode-label">
        {label}
        <output aria-live="polite">{duration(value)}</output>
      </span>
      <span className="timecode-parts">
        {showHours && (
          <>
            <TimePart
              label={`${label} hours`}
              value={hours}
              min={0}
              max={Math.floor(max / 3600)}
              disabled={disabled}
              onCommit={(next) => commit(next, minutes, seconds)}
            />
            <span>hr</span>
          </>
        )}
        <TimePart
          label={`${label} minutes`}
          value={minutes}
          min={0}
          max={showHours ? 59 : Math.floor(max / 60)}
          disabled={disabled}
          onCommit={(next) => commit(hours, next, seconds)}
        />
        <span>min</span>
        <TimePart
          label={`${label} seconds`}
          value={seconds}
          min={0}
          max={59}
          disabled={disabled}
          onCommit={(next) => commit(hours, minutes, next)}
        />
        <span>sec</span>
      </span>
    </label>
  );
}
