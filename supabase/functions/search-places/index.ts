import { createSearchFetcher } from './fetcher.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/**
 * Handles autocomplete search requests for restaurants using Google Places.
 * Validates input and session tokens to ensure cost-efficient search bundling.
 */
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
    const { input, sessionToken, location } = body;

    if (
      typeof input !== 'string' ||
      !input.trim() ||
      typeof sessionToken !== 'string'
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid payload. 'input' (non-empty) and 'sessionToken' are required strings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const fetcher = createSearchFetcher(apiKey);
    const predictions = await fetcher.fetchPredictions(
      input,
      sessionToken,
      location,
    );

    return new Response(JSON.stringify(predictions), {
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
