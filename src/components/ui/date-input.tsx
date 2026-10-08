import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Datofelt som alltid viser norsk format (dd.mm.åååå), uavhengig av nettleserspråk.
 * Verdien inn/ut er som en native <input type="date">: ISO "yyyy-MM-dd" eller "".
 *
 * - Kontrollert (value/onChange) og ukontrollert (defaultValue, react-hook-form register()).
 * - Synliggjort tekst synkes alltid fra ekstern verdi (reset(), setValue, ny value-prop),
 *   men overskrives ikke mens brukeren skriver en ufullstendig dato.
 * - Godtar 1.5.2026 (punktum/komma/skråstrek/bindestrek som skilletegn) og innliming av ISO-dato.
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
export const isoToText = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
export const toIso = (v: unknown) => {
  const s = v == null ? "" : String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

/**
 * Formaterer det brukeren skriver til dd.mm.åååå.
 * - Bare sifre: punktum settes inn automatisk når neste siffer kommer (01052026 -> 01.05.2026).
 * - Skilletegn (. , / - mellomrom) etter ett siffer fyller på med 0 (1.5. -> 01.05.).
 * - Innlimt ISO-dato (2026-05-01) konverteres.
 */
export function formatTyping(raw: string): string {
  const isoMatch = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(raw);
  if (isoMatch) return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
  const segs = ["", "", ""];
  const max = [2, 2, 4];
  let i = 0;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (segs[i].length >= max[i]) {
        if (i < 2) i++;
        else continue;
      }
      segs[i] += ch;
    } else if (/[.,/\-\s]/.test(ch)) {
      if (i < 2 && segs[i].length > 0) {
        if (segs[i].length === 1) segs[i] = "0" + segs[i];
        i++;
      }
    }
  }
  return segs[0] + (i >= 1 ? "." + segs[1] : "") + (i >= 2 ? "." + segs[2] : "");
}

/** Tolker d.m.åååå / dd.mm.åååå til ISO, eller null hvis ugyldig/ufullstendig. */
export function textToIso(text: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return dateToIso(d);
}

/** Layout-klasser (bredde, flex/grid-plassering, marg) legges på wrapperen slik at feltet oppfører seg som gamle <Input>. */
const WRAPPER_CLASS_RE =
  /^-?(?:m|mx|my|mt|mr|mb|ml|ms|me)-|^(?:w|min-w|max-w|basis|flex|grow|shrink|col|row|order|self|justify-self|place-self)-|^(?:grow|shrink)$/;
export function splitClassName(className?: string): { wrapper: string; input: string } {
  const wrapper: string[] = [];
  const input: string[] = [];
  for (const token of (className ?? "").split(/\s+/).filter(Boolean)) {
    const base = token.split(":").pop()!.replace(/^!/, "");
    (WRAPPER_CLASS_RE.test(base) ? wrapper : input).push(token);
  }
  return { wrapper: wrapper.join(" "), input: input.join(" ") };
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

    // Siste verdi vi selv har sendt ut / synket til. Ekstern endring = iso som avviker fra denne.
    const lastSyncedRef = React.useRef(iso);
    const isoRef = React.useRef(iso);
    isoRef.current = iso;
    const isControlledRef = React.useRef(isControlled);
    isControlledRef.current = isControlled;
    const hiddenRef = React.useRef<HTMLInputElement | null>(null);

    // 1) Kontrollert/ukontrollert: når verdien endres utenfra, synk synlig tekst.
    React.useEffect(() => {
      if (iso !== lastSyncedRef.current) {
        lastSyncedRef.current = iso;
        setText(isoToText(iso));
      }
    }, [iso]);

    // 2) Ukontrollert (react-hook-form register(), reset(), setValue): de skriver direkte til input.value.
    //    Vi lytter på skrivinger til det skjulte feltets value og synker intern verdi + synlig tekst.
    const onExternalWrite = React.useCallback((v: string) => {
      if (isControlledRef.current) return;
      const next = toIso(v);
      if (next === isoRef.current) return;
      isoRef.current = next;
      lastSyncedRef.current = next;
      setInnerIso(next);
      setText(isoToText(next));
    }, []);

    const setHiddenRef = React.useCallback(
      (el: HTMLInputElement | null) => {
        if (el && !(el as any).__dateInputHooked) {
          // Kjed på eksisterende descriptor (React sin verdisporing) i stedet for å erstatte den.
          const desc =
            Object.getOwnPropertyDescriptor(el, "value") ??
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
          if (desc?.get && desc?.set) {
            const { get, set } = desc;
            Object.defineProperty(el, "value", {
              configurable: true,
              enumerable: desc.enumerable,
              get() {
                return get.call(this);
              },
              set(v) {
                set.call(this, v);
                onExternalWrite(v == null ? "" : String(v));
              },
            });
            (el as any).__dateInputHooked = true;
          }
        }
        hiddenRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref, onExternalWrite]
    );

    // 3) Native form.reset() (bl.a. react-hook-form reset() uten verdier) skal tømme feltet som en native date-input:
    //    tilbake til defaultValue. Skjulte felt nullstilles ikke av nettleseren selv, så vi gjør det her.
    const defaultIsoRef = React.useRef(toIso(defaultValue));
    React.useEffect(() => {
      const form = hiddenRef.current?.form;
      if (!form) return;
      const onReset = () => {
        if (isControlledRef.current) return;
        const d = defaultIsoRef.current;
        if (hiddenRef.current) hiddenRef.current.value = d;
        lastSyncedRef.current = d;
        isoRef.current = d;
        setInnerIso(d);
        setText(isoToText(d));
      };
      form.addEventListener("reset", onReset);
      return () => form.removeEventListener("reset", onReset);
    }, []);

    const makeEvent = (v: string, type: string): DateInputEvent => {
      const t = { name: name ?? "", value: v, type: "date" as const };
      return { target: t, currentTarget: t, type, preventDefault: () => {}, stopPropagation: () => {} };
    };

    const inRange = (v: string) => (!minIso || v >= minIso) && (!maxIso || v <= maxIso);

    const emit = (v: string) => {
      if (v === iso) return;
      lastSyncedRef.current = v;
      isoRef.current = v;
      if (!isControlled) setInnerIso(v);
      // Oppdater skjult felt med en gang, så react-hook-form (som leser ref.value) ser ny verdi.
      if (!isControlled && hiddenRef.current) hiddenRef.current.value = v;
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
    const classes = splitClassName(className);

    return (
      <div className={cn("relative w-full", classes.wrapper)} style={style}>
        <input type="hidden" name={name} value={iso} ref={setHiddenRef} disabled={disabled} />
        <input
          {...(other as React.InputHTMLAttributes<HTMLInputElement>)}
          {...ariaData}
          id={id}
          type="text"
          inputMode="decimal"
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
            classes.input
          )}
          onChange={(e) => {
            const next = formatTyping(e.target.value);
            setText(next);
            if (next === "") return emit("");
            const parsed = textToIso(next);
            if (parsed && /^\d{2}\.\d{2}\.\d{4}$/.test(next) && inRange(parsed)) emit(parsed);
          }}
          onBlur={() => {
            let current = iso;
            if (text !== "") {
              const parsed = textToIso(text);
              if (parsed && inRange(parsed)) {
                if (parsed !== iso) emit(parsed);
                current = parsed;
              }
              setText(isoToText(current));
            }
            onBlur?.(makeEvent(current, "blur"));
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
