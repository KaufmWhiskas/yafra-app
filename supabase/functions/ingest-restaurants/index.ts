/**
 * @fileoverview Entry point for the ingest-restaurants Supabase Edge Function.
 * Handles incoming HTTP requests, validates bounding box parameters, and
 * orchestrates the fetching and storing of restaurant data from OpenStreetMap.
 */

import { createClient } from '@supabase/supabase-js';
import {
  fetchAndStoreRestaurants,
  OrchestratorDatabaseClient,
} from './service.ts';
import { BoundingBox } from './scanner.ts';
import { createGoogleFetcher } from './googleFetcher.ts';
import { requireUser } from '../_shared/auth.ts';

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
    // 1. Secure endpoint with reusable auth guard
    const { user, error: authError } = await requireUser(req);
    if (authError) return authError;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!supabaseUrl || !supabaseKey || !googleApiKey) {
      console.error('Server misconfiguration: Missing environment variables.');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add this temporarily to the top of your Edge Function
    console.log('Ingestion requested with body:', JSON.stringify(body));

    const bbox: BoundingBox | undefined = body.bbox;

    if (
      !bbox ||
      typeof bbox.minLat !== 'number' ||
      typeof bbox.minLon !== 'number' ||
      typeof bbox.maxLat !== 'number' ||
      typeof bbox.maxLon !== 'number'
    ) {
      return new Response(JSON.stringify({ error: 'Invalid bbox payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (
      Math.abs(bbox.maxLat - bbox.minLat) > 0.15 ||
      Math.abs(bbox.maxLon - bbox.minLon) > 0.15
    ) {
      return new Response(JSON.stringify({ error: 'Bounding box too large' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const googleFetcher = createGoogleFetcher(googleApiKey);

    await fetchAndStoreRestaurants(
      bbox,
      supabaseClient as unknown as OrchestratorDatabaseClient,
      googleFetcher,
      user!.id,
    );

    return new Response(JSON.stringify({ message: 'Scan complete' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'RateLimitError') {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Capture EVERYTHING
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('FATAL ERROR INGESTION:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
