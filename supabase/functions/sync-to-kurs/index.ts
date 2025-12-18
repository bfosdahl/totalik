import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KURS_SYNC_ENDPOINT = 'https://kynycefwxxshkedhncmc.supabase.co/functions/v1/sync-employees'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const syncApiKey = Deno.env.get('SYNC_API_KEY')
    if (!syncApiKey) {
      console.error('SYNC_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Sync API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { company_id } = await req.json()

    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Syncing employees for company: ${company_id}`)

    // Hent ansatte fra dette prosjektet
    const { data: employees, error: fetchError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, phone, position, hms_card_number, hms_card_expiry')
      .eq('company_id', company_id)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching employees:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch employees' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${employees?.length || 0} employees to sync`)

    // Send til kursprosjektet
    const response = await fetch(KURS_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-api-key': syncApiKey
      },
      body: JSON.stringify({ company_id, employees: employees || [] })
    })

    const result = await response.json()
    console.log('Sync result:', result)

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
