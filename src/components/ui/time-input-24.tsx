import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeInput24Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value?: string | null;
  onChange?: (value: string) => void;
}

/**
 * Klokkeslett-felt som alltid bruker 24-timers format (TT:MM),
 * uavhengig av telefonens/PC-ens språkinnstilling (ingen AM/PM).
 * Verdien ut er alltid "HH:MM" (samme format som <input type="time">).
 */
function normalize(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function clampToValidTime(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 3) {
    if (digits.length === 0) return "";
    const h = Math.min(23, parseInt(digits, 10));
    return `${String(h).padStart(2, "0")}:00`;
  }
  const padded = digits.padStart(4, "0").slice(0, 4);
  const h = Math.min(23, parseInt(padded.slice(0, 2), 10));
  const m = Math.min(59, parseInt(padded.slice(2), 10));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const TimeInput24 = React.forwardRef<HTMLInputElement, TimeInput24Props>(
  ({ value, onChange, className, ...props }, ref) => {
    const [text, setText] = React.useState<string>(value ? String(value).substring(0, 5) : "");

    React.useEffect(() => {
      const incoming = value ? String(value).substring(0, 5) : "";
      setText((prev) => (clampToValidTime(prev) === incoming ? prev : incoming));
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={props.placeholder ?? "TT:MM"}
        maxLength={5}
        className={cn("tabular-nums", className)}
        value={text}
        onChange={(e) => {
          const next = normalize(e.target.value);
          setText(next);
          if (/^\d{2}:\d{2}$/.test(next)) onChange?.(clampToValidTime(next));
          else if (next === "") onChange?.("");
        }}
        onBlur={(e) => {
          const fixed = clampToValidTime(text);
          setText(fixed);
          onChange?.(fixed);
          props.onBlur?.(e);
        }}
      />
    );
  }
);
TimeInput24.displayName = "TimeInput24";
