import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Datofelt som alltid viser norsk format (dd.mm.åååå), uavhengig av nettleserspråk.
 * Verdien inn/ut er som en native <input type="date">: ISO "yyyy-MM-dd" eller "".
 */

type DateInputEvent = {
  target: { name: string; value: string; type: "date" };
  currentTarget: { name: string; value: string; type: "date" };
  type: string;
  preventDefault: () => void;
  stopPropagation: () => void;
};

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value" | "defaultValue" | "type"> {
  value?: string | number | readonly string[] | null;
  defaultValue?: string | number | readonly string[] | null;
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
  type?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function isoToDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? undefined : d;
}
const dateToIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoToText = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
const toIso = (v: unknown) => {
  const s = v == null ? "" : String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

function normalize(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function textToIso(text: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return dateToIso(d);
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    { value, defaultValue, onChange, onBlur, name, id, className, placeholder, disabled, readOnly, required, autoFocus, min, max, type: _type, style, ...rest },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [innerIso, setInnerIso] = React.useState<string>(() => toIso(defaultValue));
    const iso = isControlled ? toIso(value) : innerIso;
    const [text, setText] = React.useState<string>(() => isoToText(iso));
    const [open, setOpen] = React.useState(false);
    const minIso = toIso(min);
    const maxIso = toIso(max);

    React.useEffect(() => {
      setText((prev) => (textToIso(prev) === iso || (prev !== "" && iso === "" && textToIso(prev) === null) ? prev : isoToText(iso)));
    }, [iso]);

    const makeEvent = (v: string, type: string): DateInputEvent => {
      const t = { name: name ?? "", value: v, type: "date" as const };
      return { target: t, currentTarget: t, type, preventDefault: () => {}, stopPropagation: () => {} };
    };

    const inRange = (v: string) => (!minIso || v >= minIso) && (!maxIso || v <= maxIso);

    const emit = (v: string) => {
      if (v === iso) return;
      if (!isControlled) setInnerIso(v);
      onChange?.(makeEvent(v, "change"));
    };

    const ariaData: Record<string, unknown> = {};
    const other: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (k.startsWith("aria-") || k.startsWith("data-")) ariaData[k] = v;
      else other[k] = v;
    }

    const selected = isoToDate(iso);
    const minDate = isoToDate(minIso);
    const maxDate = isoToDate(maxIso);
    const disabledDays = [
      ...(minDate ? [{ before: minDate }] : []),
      ...(maxDate ? [{ after: maxDate }] : []),
    ];

    return (
      <div className="relative w-full" style={style}>
        <input type="hidden" name={name} value={iso} ref={ref} />
        <input
          {...(other as React.InputHTMLAttributes<HTMLInputElement>)}
          {...ariaData}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder={placeholder ?? "dd.mm.åååå"}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          value={text}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-base tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          onChange={(e) => {
            const next = normalize(e.target.value);
            setText(next);
            if (next === "") return emit("");
            const parsed = textToIso(next);
            if (parsed && inRange(parsed)) emit(parsed);
          }}
          onBlur={() => {
            const parsed = textToIso(text);
            if (!(text === "" || (parsed && inRange(parsed)))) setText(isoToText(iso));
            onBlur?.(makeEvent(iso, "blur"));
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled || readOnly}
              aria-label="Velg dato"
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              disabled={disabledDays}
              onSelect={(d) => {
                if (!d) return;
                const v = dateToIso(d);
                if (!inRange(v)) return;
                setText(isoToText(v));
                emit(v);
                setOpen(false);
                onBlur?.(makeEvent(v, "blur"));
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
DateInput.displayName = "DateInput";
