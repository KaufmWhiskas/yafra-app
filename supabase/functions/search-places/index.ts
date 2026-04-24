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
    console.log("[search-places] Received body:", body); // <-- ADDED
    const { input, sessionToken } = body;

    if (
      typeof input !== "string" || !input.trim() ||
      typeof sessionToken !== "string"
    ) {
      console.error("[search-places] Invalid payload detected"); // <-- ADDED
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
      console.error("[search-places] GOOGLE_PLACES_API_KEY is missing from environment!"); // <-- ADDED
      throw new Error("Missing GOOGLE_PLACES_API_KEY environment variable");
    }

    const predictions = await fetchPredictions(input, sessionToken, apiKey);
    console.log(`[search-places] Successfully fetched ${predictions.length} predictions`); // <-- ADDED

    return new Response(JSON.stringify(predictions), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    console.error("[search-places] Caught unhandled exception:", error.message); // <-- ADDED
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
