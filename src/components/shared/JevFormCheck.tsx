import { JevCheckPanel, JevFinding } from "./JevCheckPanel";

interface Props {
  kind: "temperature" | "traceability" | "absence" | "equipment" | "vernerunde";
  label: string;
  fields: Record<string, unknown>;
  disabled?: boolean;
  hint?: string;
}

/** Smart sjekk for vanlige skjema via jev-assist «form_check». */
export function JevFormCheck({ kind, label, fields, disabled, hint }: Props) {
  return (
    <JevCheckPanel
      label={label}
      disabled={disabled}
      hint={hint}
      run={async (call) => {
        const res = await call<{ findings: JevFinding[] }>({ mode: "form_check", kind, fields });
        return res ? res.findings : null;
      }}
    />
  );
}
