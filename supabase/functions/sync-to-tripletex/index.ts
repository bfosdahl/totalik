import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tripletex API base URL (test environment)
const TRIPLETEX_API_BASE = "https://api.tripletex.io/v2";

interface TimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  entry_date: string;
  hours: number;
  project_name?: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const consumerToken = Deno.env.get('TRIPLETEX_CONSUMER_TOKEN');
    const employeeToken = Deno.env.get('TRIPLETEX_EMPLOYEE_TOKEN');

    if (!consumerToken || !employeeToken) {
      return new Response(
        JSON.stringify({ error: 'Tripletex tokens not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Parse request body
    const { timeEntryIds, startDate, endDate } = await req.json();

    // Fetch time entries to sync
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('status', 'approved');

    if (timeEntryIds && timeEntryIds.length > 0) {
      query = query.in('id', timeEntryIds);
    } else if (startDate && endDate) {
      query = query.gte('entry_date', startDate).lte('entry_date', endDate);
    }

    const { data: timeEntries, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching time entries:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch time entries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!timeEntries || timeEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No approved time entries to sync', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Tripletex session token
    const sessionResponse = await createTripletexSession(consumerToken, employeeToken);
    if (!sessionResponse.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to create Tripletex session', details: sessionResponse.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionToken = sessionResponse.token!;
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    // Sync each time entry to Tripletex
    for (const entry of timeEntries) {
      try {
        const syncResult = await syncTimeEntryToTripletex(entry, sessionToken);
        if (syncResult.success) {
          results.success.push(entry.id);
          
          // Mark as synced in our database
          await supabase
            .from('time_entries')
            .update({ 
              tripletex_synced: true, 
              tripletex_synced_at: new Date().toISOString() 
            })
            .eq('id', entry.id);
        } else {
          results.failed.push(entry.id);
          console.error(`Failed to sync entry ${entry.id}:`, syncResult.error);
        }
      } catch (error) {
        results.failed.push(entry.id);
        console.error(`Error syncing entry ${entry.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Sync completed',
        synced: results.success.length,
        failed: results.failed.length,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createTripletexSession(consumerToken: string, employeeToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Decode tokens to get the actual token values
    const consumerDecoded = JSON.parse(atob(consumerToken));
    const employeeDecoded = JSON.parse(atob(employeeToken));

    const response = await fetch(`${TRIPLETEX_API_BASE}/token/session/:create`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consumerToken: consumerDecoded.token,
        employeeToken: employeeDecoded.token,
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tripletex session creation failed:', errorText);
      return { success: false, error: `Session creation failed: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, token: data.value?.token };
  } catch (error) {
    console.error('Error creating Tripletex session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

async function syncTimeEntryToTripletex(entry: TimeEntry, sessionToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert hours to Tripletex timesheet format
    const timesheetEntry = {
      date: entry.entry_date,
      hours: entry.hours,
      comment: entry.description || entry.project_name || 'Time registration',
    };

    const response = await fetch(`${TRIPLETEX_API_BASE}/timesheet/entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`0:${sessionToken}`)}`,
      },
      body: JSON.stringify(timesheetEntry)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
