import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KURS_SYNC_ENDPOINT = 'https://kynycefwxxshkedhncmc.supabase.co/functions/v1/sync-from-cn'

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized - missing authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user client for auth verification
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid or expired token:', claimsError)
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = claimsData.claims.sub
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized - no user ID' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { company_id } = await req.json()

    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user belongs to this company
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (userProfile.company_id !== company_id) {
      console.error('User attempted to sync a company they do not belong to')
      return new Response(JSON.stringify({ error: 'Access denied - not authorized for this company' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is company_admin or system_admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isAdmin = roles?.some(r => r.role === 'company_admin' || r.role === 'system_admin')
    if (!isAdmin) {
      console.error('User does not have admin privileges for sync operation')
      return new Response(JSON.stringify({ error: 'Only company admins can trigger sync' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Authorized sync for company: ${company_id} by user: ${userId}`)

    // Hent bedriftsdata
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, org_number, email, phone, address, postal_code, city')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      console.error('Error fetching company:', companyError)
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Hent ansatte fra dette prosjektet
    const { data: employees, error: fetchError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, phone')
      .eq('company_id', company_id)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching employees:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch employees' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found company: ${company.name}, employees: ${employees?.length || 0}`)

    // Send til kursprosjektet
    const response = await fetch(KURS_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-api-key': syncApiKey
      },
      body: JSON.stringify({ 
        company: company,
        employees: employees || [] 
      })
    })

    const result = await response.json()
    console.log('Sync result:', result)

    return new Response(JSON.stringify({
      success: response.ok,
      result
    }), {
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
