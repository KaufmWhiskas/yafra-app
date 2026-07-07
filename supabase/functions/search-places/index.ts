import { corsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth.ts';

interface SearchRequest {
  input: string;
  sessionToken: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface GooglePlacesPayload {
  input: string;
  sessionToken: string;
  locationBias?: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  origin?: {
    // FIX: Add origin to payload type
    latitude: number;
    longitude: number;
  };
}

interface GoogleSuggestion {
  placePrediction?: {
    placeId: string;
    distanceMeters?: number;
    types?: string[]; // <-- ADD THIS
    text: {
      text: string;
    };
  };
}

interface GoogleAutocompleteResponse {
  suggestions: GoogleSuggestion[];
}

export async function serve(
  req: Request,
  options?: {
    requireUserFn?: (req: Request) => Promise<{ error: Response | null }>;
  },
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requireUserFn = options?.requireUserFn || requireUser;

    // Secure endpoint with reusable auth guard
    const { error: authError } = await requireUserFn(req);
    if (authError) return authError;

    const { input, sessionToken, location }: SearchRequest = await req.json();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY env var');
    if (!sessionToken)
      throw new Error('Missing "sessionToken" in request body');

    // Sanitize and validate input parameters
    if (typeof input !== 'string' || input.length === 0 || input.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing "input" parameter' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    const googleApiUrl = 'https://places.googleapis.com/v1/places:autocomplete';

    const payload: GooglePlacesPayload = { input, sessionToken };

    if (location) {
      // 1. Bias search relevance tightly around the viewport anchor bubble
      payload.locationBias = {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: 10000, // Expanded slightly to 10km for robust city-wide matching
        },
      };

      // 2. Pass origin parameters so Google returns true geodesic distanceMeters
      payload.origin = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!googleResponse.ok) {
      const errJson = await googleResponse.json();
      console.error('Google API Error:', errJson);
      throw new Error(JSON.stringify(errJson));
    }

    const data: GoogleAutocompleteResponse = await googleResponse.json();

    const predictions = (data.suggestions || [])
      .filter((s: GoogleSuggestion) => s.placePrediction)
      .map((s: GoogleSuggestion) => ({
        description: s.placePrediction!.text.text,
        placeId: s.placePrediction!.placeId,
        types: s.placePrediction!.types || [], // <-- ADD THIS
        distanceMeters: s.placePrediction!.distanceMeters ?? Infinity,
        distance:
          s.placePrediction!.distanceMeters != null
            ? `${(s.placePrediction!.distanceMeters / 1000).toFixed(1)} km`
            : null,
      }));

    // Force a strict distance sort if the user's location is known
    if (location?.latitude != null && location?.longitude != null) {
      predictions.sort((a, b) => {
        const distA = a.distanceMeters ?? Infinity;
        const distB = b.distanceMeters ?? Infinity;
        if (distA === distB) return 0;
        return distA < distB ? -1 : 1;
      });
    }

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    console.error('Function error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}

Deno.serve((req) => serve(req));
