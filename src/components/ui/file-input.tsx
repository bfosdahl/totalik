import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Norsk filvelger. Nettleserens egen <input type="file"> viser tekst på nettleserspråket
 * ("Choose File / No file chosen"), så vi viser egen knapp og filnavn og skjuler det native feltet.
 * Ref, onChange, accept, multiple, capture, id og name går til det ekte input-feltet som før.
 */
export const FileInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, style, onChange, disabled, multiple, type: _type, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [names, setNames] = React.useState<string[]>([]);

    const setRefs = React.useCallback(
      (el: HTMLInputElement | null) => {
        if (el && !(el as any).__fileInputHooked) {
          // Når koden nullstiller feltet (input.value = ""), skal visningen også nullstilles.
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
                if (v === "" || v == null) setNames([]);
              },
            });
            (el as any).__fileInputHooked = true;
          }
        }
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref]
    );

    React.useEffect(() => {
      const form = inputRef.current?.form;
      if (!form) return;
      const onReset = () => setNames([]);
      form.addEventListener("reset", onReset);
      return () => form.removeEventListener("reset", onReset);
    }, []);

    const label =
      names.length === 0 ? "Ingen fil valgt" : names.length === 1 ? names[0] : `${names.length} filer valgt`;

    return (
      <div
        className={cn(
          "relative flex h-10 w-full items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 md:text-sm",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        style={style}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground hover:underline focus-visible:outline-none disabled:pointer-events-none"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {multiple ? "Velg filer" : "Velg fil"}
        </button>
        <span className="min-w-0 truncate text-muted-foreground" title={names.join(", ") || undefined}>
          {label}
        </span>
        <input
          {...props}
          ref={setRefs}
          type="file"
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            setNames(Array.from(e.target.files ?? []).map((f) => f.name));
            onChange?.(e);
          }}
        />
      </div>
    );
  }
);
FileInput.displayName = "FileInput";
