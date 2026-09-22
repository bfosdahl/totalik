// Felles visuell profil for ALLE kunde-e-poster fra Total-IK.
// Design inspirert av brevmalen fra Athena HMS / Kurskontoret:
// mørk lilla topp med logo i hvit "flis", serif-overskrift og pill-merkelapp.

export const BRAND = {
  deep: "#2A1550",
  deepMid: "#3B1E6E",
  accent: "#7C3AED",
  accentSoft: "#C4A6F5",
  border: "#E7E3F1",
  surface: "#F7F5FC",
  text: "#241F31",
  muted: "#6B6580",
  logo: "https://totalik.no/total-ik-logo.png",
  site: "https://totalik.no",
  supportEmail: "post@athenahms.no",
  supportPhone: "+47 941 49 311",
  companyLine: "Athena Kurs og Internkontroll AS &middot; Org.nr 934606450 &middot; Gr&oslash;nland 1, 1767 Halden",
};

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',Times,serif";

interface BrandedEmailOptions {
  /** Overskrift i den m&oslash;rke toppen */
  heading: string;
  /** Kort undertekst under overskriften */
  subheading?: string;
  /** Skjult forh&aring;ndsvisningstekst i innboksen */
  preheader?: string;
  /** Liten merkelapp &oslash;verst, f.eks. "VELKOMMEN" */
  badge?: string;
  /** Hovedinnhold (HTML) */
  bodyHtml: string;
  /** Ekstra liten tekst nederst, over signaturen */
  footerNote?: string;
}

export function brandedEmail(opts: BrandedEmailOptions): string {
  const { heading, subheading, preheader, bodyHtml, footerNote, badge } = opts;

  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;font-family:${SANS};">

      <tr><td style="background:${BRAND.deep};background-image:linear-gradient(135deg,${BRAND.deep} 0%,${BRAND.deepMid} 55%,#6B2E9E 100%);padding:34px 34px 38px 34px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="left" valign="top">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="background:#ffffff;border-radius:16px;padding:12px 16px;">
                  <img src="${BRAND.logo}" alt="Total IK" width="120" style="display:block;width:120px;max-width:120px;height:auto;border:0;">
                </td></tr>
              </table>
              <p style="margin:12px 0 0 0;color:#ffffff;font-size:12px;letter-spacing:3px;font-weight:700;">TOTAL IK</p>
            </td>
            <td align="right" valign="top" style="color:${BRAND.accentSoft};font-size:12px;line-height:1.8;">
              Athena HMS<br>
              ${BRAND.supportEmail}<br>
              totalik.no
            </td>
          </tr>
        </table>

        ${badge ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0 0;"><tr><td style="border:1px solid rgba(255,255,255,0.35);border-radius:999px;padding:7px 18px;color:#ffffff;font-size:11px;letter-spacing:2px;font-weight:700;">${badge}</td></tr></table>` : ""}

        <h1 style="margin:${badge ? "18px" : "30px"} 0 0 0;color:#ffffff;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:700;">${heading}</h1>
        ${subheading ? `<p style="margin:12px 0 0 0;color:#D9CCF5;font-size:15px;line-height:1.6;">${subheading}</p>` : ""}
      </td></tr>

      <tr><td style="padding:30px 34px 8px 34px;color:${BRAND.text};font-size:15px;line-height:1.7;">
        ${bodyHtml}
      </td></tr>

      ${footerNote ? `<tr><td style="padding:0 34px 8px 34px;color:${BRAND.muted};font-size:13px;line-height:1.6;">${footerNote}</td></tr>` : ""}

      <tr><td style="padding:24px 34px 30px 34px;">
        <div style="border-top:1px solid ${BRAND.border};padding-top:18px;color:${BRAND.muted};font-size:13px;line-height:1.7;">
          <p style="margin:0 0 4px 0;color:${BRAND.text};font-weight:700;">Total IK &ndash; digitalt internkontrollsystem</p>
          <p style="margin:0;">Sp&oslash;rsm&aring;l? Svar gjerne p&aring; denne e-posten eller kontakt oss:</p>
          <p style="margin:4px 0 0 0;">
            <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.supportEmail}</a>
            &nbsp;&middot;&nbsp; ${BRAND.supportPhone}
            &nbsp;&middot;&nbsp; <a href="${BRAND.site}" style="color:${BRAND.accent};text-decoration:none;">totalik.no</a>
          </p>
          <p style="margin:12px 0 0 0;color:#9A93AC;font-size:12px;">${BRAND.companyLine}</p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Knapp i profil */
export function brandButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto;"><tr><td style="background:${BRAND.accent};border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;font-family:${SANS};">${label}</a>
  </td></tr></table>`;
}
