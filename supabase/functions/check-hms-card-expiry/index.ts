import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { recordJobRun } from "../_shared/jobRun.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

interface ProfileWithExpiry {
  id: string
  user_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  hms_card_expiry_date: string | null
  hms_card_reminder_sent_7_days: boolean
  hms_card_reminder_sent_30_days: boolean
  hms_card_reminder_sent_60_days: boolean
  hms_card_reminder_sent_90_days: boolean
  company_id: string
}

interface CompanyAdmin {
  email: string | null
  first_name: string | null
  last_name: string | null
}

Deno.serve(async (req) => {
  const jobStart = Date.now();
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate cron secret for scheduled job security
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== Deno.env.get("CRON_SECRET")) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Checking HMS card expiry dates...')

    const today = new Date()
    const in7Days = new Date(today)
    in7Days.setDate(today.getDate() + 7)
    const in30Days = new Date(today)
    in30Days.setDate(today.getDate() + 30)
    const in60Days = new Date(today)
    in60Days.setDate(today.getDate() + 60)
    const in90Days = new Date(today)
    in90Days.setDate(today.getDate() + 90)

    // Fetch profiles with HMS card expiry dates
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('hms_card_required', true)
      .eq('hms_card_obtained', true)
      .not('hms_card_expiry_date', 'is', null)
      .eq('is_active', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log(`Found ${profiles?.length || 0} profiles with HMS cards`)

    const notifications: { type: string; profile: ProfileWithExpiry }[] = []

    for (const profile of (profiles || []) as ProfileWithExpiry[]) {
      const expiryDate = new Date(profile.hms_card_expiry_date!)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`Profile ${profile.id}: HMS card expires in ${daysUntilExpiry} days`)

      // Check 90 days
      if (daysUntilExpiry <= 90 && daysUntilExpiry > 60 && !profile.hms_card_reminder_sent_90_days) {
        notifications.push({ type: '90_days', profile })
        await supabase
          .from('profiles')
          .update({ hms_card_reminder_sent_90_days: true })
          .eq('id', profile.id)
      }
      // Check 60 days
      else if (daysUntilExpiry <= 60 && daysUntilExpiry > 30 && !profile.hms_card_reminder_sent_60_days) {
        notifications.push({ type: '60_days', profile })
        await supabase
          .from('profiles')
          .update({ hms_card_reminder_sent_60_days: true })
          .eq('id', profile.id)
      }
      // Check 30 days
      else if (daysUntilExpiry <= 30 && daysUntilExpiry > 7 && !profile.hms_card_reminder_sent_30_days) {
        notifications.push({ type: '30_days', profile })
        await supabase
          .from('profiles')
          .update({ hms_card_reminder_sent_30_days: true })
          .eq('id', profile.id)
      }
      // Check 7 days
      else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !profile.hms_card_reminder_sent_7_days) {
        notifications.push({ type: '7_days', profile })
        await supabase
          .from('profiles')
          .update({ hms_card_reminder_sent_7_days: true })
          .eq('id', profile.id)
      }
    }

    console.log(`Sending ${notifications.length} notifications`)

    // Send email notifications if Resend API key is available
    if (resendApiKey && notifications.length > 0) {
      for (const notification of notifications) {
        const { type, profile } = notification
        const expiryDate = new Date(profile.hms_card_expiry_date!)
        const formattedDate = expiryDate.toLocaleDateString('nb-NO')
        const employeeName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Ansatt'

        let subject = ''
        let daysText = ''

        switch (type) {
          case '90_days':
            daysText = '90 dager'
            break
          case '60_days':
            daysText = '60 dager'
            break
          case '30_days':
            daysText = '30 dager'
            break
          case '7_days':
            daysText = '7 dager'
            break
        }

        subject = `HMS-kort utløper om ${daysText} - ${employeeName}`

        const emailContent = `
          <h2>HMS-kort utløper snart</h2>
          <p>Hei,</p>
          <p>Dette er en påminnelse om at HMS-kortet til <strong>${esc(employeeName)}</strong> utløper <strong>${formattedDate}</strong> (om ${daysText}).</p>
          <p>Vennligst sørg for å fornye HMS-kortet før utløpsdatoen for å sikre at arbeidstakeren kan fortsette å jobbe i henhold til regelverket.</p>
          <p>Med vennlig hilsen,<br>Total-IK</p>
        `

        // Send to employee if they have email
        if (profile.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Total-IK <noreply@totalik.no>',
                to: [profile.email],
                subject: subject,
                html: emailContent,
              }),
            })
            console.log(`Sent ${type} reminder to employee: ${profile.email}`)
          } catch (emailError) {
            console.error(`Failed to send email to ${profile.email}:`, emailError)
          }
        }

        // Find company admins for this company only and notify only them
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'company_admin')

        const adminUserIds = new Set((adminRoles || []).map(r => r.user_id))

        const { data: companyAdmins } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .eq('company_id', profile.company_id)
          .eq('is_active', true)

        for (const admin of (companyAdmins || []) as (CompanyAdmin & { user_id: string })[]) {
          if (!admin.user_id || !adminUserIds.has(admin.user_id)) continue;
          if (admin.email && admin.email !== profile.email) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Total-IK <noreply@totalik.no>',
                  to: [admin.email],
                  subject: `[Leder] ${subject}`,
                  html: emailContent,
                }),
              })
              console.log(`Sent ${type} reminder to admin: ${admin.email}`)
            } catch (emailError) {
              console.error(`Failed to send email to admin ${admin.email}:`, emailError)
            }
          }
        }
      }
    }

    await recordJobRun("check-hms-card-expiry", "success", jobStart, {
      itemsProcessed: profiles?.length || 0,
      notificationsSent: notifications.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
        message: `Processed ${profiles?.length || 0} profiles, sent ${notifications.length} notifications`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in check-hms-card-expiry:', error)
    await recordJobRun("check-hms-card-expiry", "error", jobStart, {
      errorCount: 1,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    console.error('check-hms-card-expiry error:', error);
    const errorMessage = 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
