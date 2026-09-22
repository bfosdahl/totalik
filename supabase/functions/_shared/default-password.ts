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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FC;border:1px solid #E7E3F1;border-left:4px solid #7C3AED;border-radius:12px;margin:22px 0;">
      <tr><td style="padding:20px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#241F31;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 10px 0;font-weight:700;color:#2A1550;font-family:Georgia,'Times New Roman',Times,serif;font-size:17px;">Din innlogging</p>
        <p style="margin:0 0 6px 0;"><span style="color:#6B6580;">Nettadresse:</span> <a href="${LOGIN_URL}" style="color:#7C3AED;text-decoration:none;">${LOGIN_URL}</a></p>
        <p style="margin:0 0 6px 0;"><span style="color:#6B6580;">Brukernavn:</span> <strong>${esc(email)}</strong></p>
        <p style="margin:0;"><span style="color:#6B6580;">Passord:</span> <code style="background:#ffffff;padding:4px 10px;border-radius:6px;border:1px solid #E7E3F1;font-size:15px;">${DEFAULT_PASSWORD}</code></p>
        <p style="margin:12px 0 0 0;color:#6B6580;font-size:13px;">Vi anbefaler at du bytter passord etter f&oslash;rste innlogging (Innstillinger &rarr; Passord).</p>
      </td></tr>
    </table>`;
}

/**
 * Standard innloggingsblokk: passord + tydelig lenke/knapp til totalik.no/auth.
 * Bruk denne i ALLE kunde-e-poster (nysalg, fornyelse, invitasjoner).
 */
export function loginBlockHtml(email: string, recoveryLink?: string | null): string {
  return `
    ${defaultPasswordHtml(email)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto;"><tr><td style="background:#7C3AED;border-radius:999px;">
      <a href="${LOGIN_URL}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Logg inn p&aring; Total IK</a>
    </td></tr></table>
    <p style="color:#6B6580;font-size:13px;text-align:center;margin:0 0 18px 0;">Fungerer ikke knappen? Kopier denne adressen inn i nettleseren:<br><a href="${LOGIN_URL}" style="color:#7C3AED;word-break:break-all;">${LOGIN_URL}</a></p>
    ${recoveryLink ? `<p style="color:#6B6580;font-size:13px;text-align:center;margin:0 0 18px 0;">Vil du heller sette ditt eget passord med en gang? <a href="${recoveryLink}" style="color:#7C3AED;">Klikk her</a> (lenken utl&oslash;per om 24 timer).</p>` : ``}`;
}
