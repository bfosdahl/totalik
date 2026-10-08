import { createClient } from 'npm:@supabase/supabase-js@2';
import { escapeHtml } from '../_shared/html-escape.ts';
import { guardedResendSend, guardedResendBatch, guardedResendFetch } from "../_shared/emailSuppression.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const clean = (v: unknown, max = 200): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Ugyldig forespørsel' }, 400);

    const orgNumber = clean((body as any).orgNumber, 20).replace(/\s/g, '');
    const companyName = clean((body as any).companyName, 150);
    const contactName = clean((body as any).contactName, 120);
    const email = clean((body as any).email, 200).toLowerCase();
    const phone = clean((body as any).phone, 30);
    const termsAccepted = (body as any).termsAccepted === true;
    const allowedSources = ['nybygg', 'nyreggrenhold', 'nyreggfrisor', 'nyreggservering'];
    const rawSource = clean((body as any).source, 40);
    const source = allowedSources.includes(rawSource) ? rawSource : 'nybygg';

    if (!/^\d{9}$/.test(orgNumber)) return json({ error: 'Organisasjonsnummer må ha 9 siffer' }, 400);
    if (!companyName) return json({ error: 'Bedriftsnavn mangler' }, 400);
    if (!contactName) return json({ error: 'Kontaktperson mangler' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Ugyldig e-postadresse' }, 400);
    if (phone.replace(/\D/g, '').length < 8) return json({ error: 'Ugyldig telefonnummer' }, 400);
    if (!termsAccepted) return json({ error: 'Vilkårene må godtas' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase
      .from('nybygg_leads')
      .insert({
        org_number: orgNumber,
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        terms_accepted: true,
        source,
      })
      .select('id')
      .single();

    if (error) {
      console.error('nybygg lead insert failed', error);
      return json({ error: 'Kunne ikke lagre aktiveringen. Prøv igjen.' }, 500);
    }

    // Best effort: varsle Viktor og kunden
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const rows = `
        <p><strong>Bedrift:</strong> ${escapeHtml(companyName)} (${escapeHtml(orgNumber)})</p>
        <p><strong>Kontaktperson:</strong> ${escapeHtml(contactName)}</p>
        <p><strong>E-post:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>`;

      const send = (to: string[], subject: string, html: string) =>
        guardedResendFetch(supabase, "submit-nybygg-lead", {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: 'Total-IK <post@athenahms.no>', to, subject, html }),
        }).catch((e) => console.error('resend failed', e));

      await Promise.allSettled([
        send(
          ['viktor@athenahms.no', 'post@athenahms.no'],
          `Ny aktivering (${source}): ${companyName}`,
          `<h2>Ny velkomstpakke aktivert</h2>${rows}`,
        ),
        send(
          [email],
          'Vi har mottatt aktiveringen din - Total-IK',
          `<h2>Takk, ${escapeHtml(contactName)}!</h2>
           <p>Vi har mottatt aktiveringen for ${escapeHtml(companyName)}. Systemet er klart innen 48 timer, og vi tar kontakt med deg.</p>
           <p>Har du spørsmål før det? Ring Viktor Ørnelund på 941 49 311 eller svar på denne e-posten.</p>
           <p>Athena Kurs og Internkontroll AS &middot; Gr&oslash;nland 1, 1767 Halden &middot; Org.nr 934606450</p>`,
        ),
      ]);
    }

    return json({ ok: true, id: data.id });
  } catch (e) {
    console.error('submit-nybygg-lead error', e);
    return json({ error: 'Uventet feil' }, 500);
  }
});
