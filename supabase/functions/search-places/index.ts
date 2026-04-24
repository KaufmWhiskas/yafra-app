import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
import { fetchPredictions } from "./fetcher.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Handles autocomplete search requests for restaurants using Google Places.
 * Validates input and session tokens to ensure cost-efficient search bundling.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { input, sessionToken } = body;

    if (
      typeof input !== "string" || !input.trim() ||
      typeof sessionToken !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid payload. 'input' (non-empty) and 'sessionToken' are required strings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("Missing GOOGLE_PLACES_API_KEY environment variable");
    }

    const predictions = await fetchPredictions(input, sessionToken, apiKey);

    return new Response(JSON.stringify(predictions), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
