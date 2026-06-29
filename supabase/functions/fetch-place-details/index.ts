import { createClient } from '@supabase/supabase-js';
import { fetchProDetails } from './fetcher.ts';
import { DatabaseClient, getOrFetchPlaceDetails } from './service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const rawPlaceId = body?.googlePlaceId;

    if (!rawPlaceId || typeof rawPlaceId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid googlePlaceId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Clean the prefix immediately so the database query uses the correct ID format
    const googlePlaceId = rawPlaceId.replace(/^places\//, '');

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const data = await getOrFetchPlaceDetails(
      googlePlaceId,
      apiKey,
      supabase as unknown as DatabaseClient,
      fetchProDetails,
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
