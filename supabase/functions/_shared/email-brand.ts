// Felles visuell profil for ALLE kunde-e-poster fra Total-IK.
// Bruk brandedEmail() som ytre ramme i stedet for egne <html>-maler,
// slik at alle e-poster ser like og profesjonelle ut.

export const BRAND = {
  navy: "#101828",
  primary: "#1A4DA0",
  primaryDark: "#143B7A",
  border: "#E4E8EF",
  surface: "#F6F8FB",
  text: "#1F2937",
  muted: "#6B7280",
  logo: "https://totalik.no/total-ik-logo.png",
  site: "https://totalik.no",
  supportEmail: "post@athenahms.no",
  supportPhone: "+47 405 00 020",
  companyLine: "Athena HMS AS &middot; Org.nr. 926 073 704",
};

interface BrandedEmailOptions {
  /** Overskrift i den bl&aring; toppen */
  heading: string;
  /** Kort undertekst under overskriften */
  subheading?: string;
  /** Skjult forh&aring;ndsvisningstekst i innboksen */
  preheader?: string;
  /** Hovedinnhold (HTML) */
  bodyHtml: string;
  /** Ekstra liten tekst nederst, over signaturen */
  footerNote?: string;
}

export function brandedEmail(opts: BrandedEmailOptions): string {
  const { heading, subheading, preheader, bodyHtml, footerNote } = opts;

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
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

      <tr><td style="padding:28px 32px 20px 32px;background:#ffffff;border-bottom:1px solid ${BRAND.border};">
        <img src="${BRAND.logo}" alt="Total IK" width="150" style="display:block;width:150px;max-width:150px;height:auto;border:0;">
      </td></tr>

      <tr><td style="background:${BRAND.navy};padding:26px 32px;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;font-weight:700;">${heading}</h1>
        ${subheading ? `<p style="margin:8px 0 0 0;color:#AFC3E6;font-size:14px;line-height:1.5;">${subheading}</p>` : ""}
      </td></tr>

      <tr><td style="padding:28px 32px 8px 32px;color:${BRAND.text};font-size:15px;line-height:1.65;">
        ${bodyHtml}
      </td></tr>

      ${footerNote ? `<tr><td style="padding:0 32px 8px 32px;color:${BRAND.muted};font-size:13px;line-height:1.6;">${footerNote}</td></tr>` : ""}

      <tr><td style="padding:24px 32px 28px 32px;">
        <div style="border-top:1px solid ${BRAND.border};padding-top:18px;color:${BRAND.muted};font-size:13px;line-height:1.7;">
          <p style="margin:0 0 4px 0;color:${BRAND.text};font-weight:600;">Total IK &ndash; digitalt internkontrollsystem</p>
          <p style="margin:0;">Sp&oslash;rsm&aring;l? Svar gjerne p&aring; denne e-posten eller kontakt oss:</p>
          <p style="margin:4px 0 0 0;">
            <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primary};text-decoration:none;">${BRAND.supportEmail}</a>
            &nbsp;&middot;&nbsp; ${BRAND.supportPhone}
            &nbsp;&middot;&nbsp; <a href="${BRAND.site}" style="color:${BRAND.primary};text-decoration:none;">totalik.no</a>
          </p>
          <p style="margin:12px 0 0 0;color:#9AA3B2;font-size:12px;">${BRAND.companyLine}</p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Bl&aring; knapp i profil */
export function brandButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto;"><tr><td style="background:${BRAND.primary};border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:14px 30px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">${label}</a>
  </td></tr></table>`;
}
