// Public edge function called from GitHub Actions on E2E failure.
// Auth: shared token via X-Notify-Token header.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-notify-token",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = req.headers.get("x-notify-token");
    const expected = Deno.env.get("E2E_NOTIFY_TOKEN");
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const {
      repo = "bfosdahl/totalik",
      workflow = "E2E Playwright",
      branch = "unknown",
      commit = "unknown",
      commitMessage = "",
      actor = "unknown",
      runId = "",
      runUrl = "",
      prNumber = null,
      prTitle = "",
      prUrl = "",
      browser = "",
      inputMode = "",
      failedJob = "",
      summary = "",
    } = body ?? {};

    const subject = prNumber
      ? `❌ E2E feilet på PR #${prNumber} — ${browser}·${inputMode}`
      : `❌ E2E feilet på ${branch} — ${browser}·${inputMode}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;margin:0;padding:20px;">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
  <div style="background:#dc2626;color:#fff;padding:20px 28px;">
    <h1 style="margin:0;font-size:18px;">E2E-test feilet</h1>
    <div style="opacity:.9;font-size:13px;margin-top:4px;">${esc(repo)} · ${esc(workflow)}</div>
  </div>
  <div style="padding:24px 28px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${prNumber ? `<tr><td style="padding:6px 0;color:#64748b;width:140px;">Pull request</td><td><a href="${esc(prUrl)}" style="color:#2563eb;">#${esc(prNumber)} — ${esc(prTitle)}</a></td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#64748b;">Branch</td><td>${esc(branch)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Commit</td><td><code>${esc(String(commit).slice(0, 12))}</code> ${esc(commitMessage)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Utført av</td><td>${esc(actor)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Kombinasjon</td><td>${esc(browser)} · ${esc(inputMode)}</td></tr>
      ${failedJob ? `<tr><td style="padding:6px 0;color:#64748b;">Feilet steg</td><td>${esc(failedJob)}</td></tr>` : ""}
    </table>

    ${summary ? `<div style="margin-top:16px;background:#f1f5f9;border-left:4px solid #dc2626;padding:12px 14px;border-radius:0 6px 6px 0;font-family:ui-monospace,Menlo,monospace;font-size:12px;white-space:pre-wrap;">${esc(summary).slice(0, 4000)}</div>` : ""}

    <p style="text-align:center;margin:28px 0 8px;">
      <a href="${esc(runUrl)}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Åpne workflow-kjøring</a>
    </p>
    <p style="font-size:12px;color:#64748b;text-align:center;margin:0;">Run ID: ${esc(runId)}</p>
  </div>
  <div style="text-align:center;padding:14px;color:#94a3b8;font-size:11px;background:#f8fafc;border-top:1px solid #e2e8f0;">
    Automatisk varsel fra GitHub Actions · Total-IK
  </div>
</div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Total-IK CI <noreply@totalik.no>",
        to: ["ben@athenahms.no"],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error", res.status, err);
      return new Response(JSON.stringify({ error: "resend_failed", details: err }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-e2e-failure error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
