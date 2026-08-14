// Felles standardpassord for alle nye brukere.
// Bevisst valg: engangs-recovery-lenker blir ofte forbrukt av Outlook/SafeLinks før
// mottakeren rekker å klikke. Alle nye brukere får derfor det samme midlertidige
// passordet og oppfordres til å bytte det selv etter første innlogging.
// IKKE endre uten å avklare med Ben.
export const DEFAULT_PASSWORD = "Abc_1234";

export function defaultPasswordHtml(email: string): string {
  const esc = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  return `
    <div style="background:#f4f7fb;border:1px solid #d0d7e2;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px 0;"><strong>E-post:</strong> ${esc(email)}</p>
      <p style="margin:0;"><strong>Midlertidig passord:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;border:1px solid #d0d7e2;">${DEFAULT_PASSWORD}</code></p>
      <p style="margin:12px 0 0 0;color:#b8500a;font-size:13px;">Bytt passord etter f&oslash;rste innlogging (Innstillinger &rarr; Passord).</p>
    </div>`;
}
