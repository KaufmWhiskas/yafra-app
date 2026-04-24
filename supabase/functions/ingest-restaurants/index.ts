/**
 * @fileoverview Entry point for the ingest-restaurants Supabase Edge Function.
 * Handles incoming HTTP requests, validates bounding box parameters, and
 * orchestrates the fetching and storing of restaurant data from OpenStreetMap.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  fetchAndStoreRestaurants,
  OrchestratorDatabaseClient,
} from "./service.ts";
import { BoundingBox } from "./scanner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Main HTTP request handler and entry point for the Edge Function.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bbox: BoundingBox = body.bbox;

    if (
      !bbox ||
      typeof bbox.minLat !== "number" ||
      typeof bbox.minLon !== "number" ||
      typeof bbox.maxLat !== "number" ||
      typeof bbox.maxLon !== "number"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid bbox payload. Expected minLat, minLon, maxLat, maxLon as numbers.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    await fetchAndStoreRestaurants(
      bbox,
      supabaseClient as unknown as OrchestratorDatabaseClient,
    );

    return new Response(JSON.stringify({ message: "Scan complete" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Ingest Function Error:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
