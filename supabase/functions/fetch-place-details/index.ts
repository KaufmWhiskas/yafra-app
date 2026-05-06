// deno-lint-ignore no-import-prefix
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
// deno-lint-ignore no-import-prefix
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchProDetails } from "./fetcher.ts";
import { DatabaseClient, getOrFetchPlaceDetails } from "./service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const rawPlaceId = body?.googlePlaceId;

    if (!rawPlaceId || typeof rawPlaceId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid googlePlaceId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Clean the prefix immediately so the database query uses the correct ID format
    const googlePlaceId = rawPlaceId.replace(/^places\//, "");

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing GOOGLE_PLACES_API_KEY environment variable",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const data = await getOrFetchPlaceDetails(
      googlePlaceId,
      apiKey,
      supabase as unknown as DatabaseClient,
      fetchProDetails,
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
