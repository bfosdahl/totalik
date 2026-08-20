// Felles standardpassord for alle nye brukere.
// Bevisst valg: engangs-recovery-lenker blir ofte forbrukt av Outlook/SafeLinks før
// mottakeren rekker å klikke. Alle nye brukere får derfor det samme midlertidige
// passordet og oppfordres til å bytte det selv etter første innlogging.
// IKKE endre uten å avklare med Ben.
export const DEFAULT_PASSWORD = "Abc_1234";

export const LOGIN_URL = "https://totalik.no/auth";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function defaultPasswordHtml(email: string): string {
  return `
    <div style="background:#f4f7fb;border:1px solid #d0d7e2;border-radius:8px;padding:20px;margin:24px 0;text-align:left;">
      <p style="margin:0 0 8px 0;"><strong>Innloggingsadresse:</strong> <a href="${LOGIN_URL}" style="color:#0066cc;">${LOGIN_URL}</a></p>
      <p style="margin:0 0 8px 0;"><strong>E-post:</strong> ${esc(email)}</p>
      <p style="margin:0;"><strong>Passord:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;border:1px solid #d0d7e2;">${DEFAULT_PASSWORD}</code></p>
      <p style="margin:12px 0 0 0;color:#b8500a;font-size:13px;">Bytt passord etter f&oslash;rste innlogging (Innstillinger &rarr; Passord).</p>
    </div>`;
}

/**
 * Standard innloggingsblokk: passord + tydelig lenke/knapp til totalik.no/auth.
 * Bruk denne i ALLE kunde-e-poster (nysalg, fornyelse, invitasjoner).
 */
export function loginBlockHtml(email: string, recoveryLink?: string | null): string {
  return `
    ${defaultPasswordHtml(email)}
    <div style="text-align:center;margin:24px 0;">
      <a href="${LOGIN_URL}" style="background:linear-gradient(135deg,#0066cc 0%,#0052a3 100%);color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">Logg inn p&aring; Total-IK</a>
    </div>
    <p style="color:#444;font-size:14px;text-align:center;margin:0 0 8px 0;">Fungerer ikke knappen? Kopier og lim inn denne adressen i nettleseren:</p>
    <p style="text-align:center;font-size:15px;word-break:break-all;margin:0 0 20px 0;"><a href="${LOGIN_URL}" style="color:#0066cc;">${LOGIN_URL}</a></p>
    ${recoveryLink ? `<p style="color:#666;font-size:13px;text-align:center;margin:0 0 20px 0;">Vil du heller sette ditt eget passord med en gang? <a href="${recoveryLink}" style="color:#0066cc;">Klikk her</a> (lenken utl&oslash;per om 24 timer).</p>` : ``}`;
}
