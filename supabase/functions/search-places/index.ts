import { corsHeaders } from '../_shared/cors.ts';

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
  // NEW: Instructs Google to calculate exact distances from the user
  origin?: {
    latitude: number;
    longitude: number;
  };
}

interface GoogleSuggestion {
  placePrediction?: {
    placeId: string;
    distanceMeters?: number; // NEW: Google returns this if origin is provided
    text: {
      text: string;
    };
  };
}

interface GoogleAutocompleteResponse {
  suggestions: GoogleSuggestion[];
}

export async function serve(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { input, sessionToken, location }: SearchRequest = await req.json();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY env var');
    if (!input) throw new Error('Missing "input" in request body');
    if (!sessionToken)
      throw new Error('Missing "sessionToken" in request body');

    const googleApiUrl = 'https://places.googleapis.com/v1/places:autocomplete';

    const payload: GooglePlacesPayload = { input, sessionToken };

    // Tighten the radius and provide an origin to calculate distances
    if (location?.latitude != null && location?.longitude != null) {
      payload.locationBias = {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: 5000, // Dropped back to a strict 5km local radius
        },
      };
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
        distanceMeters: s.placePrediction!.distanceMeters ?? Infinity,
        // Provide distance in KM for display context
        distance: s.placePrediction!.distanceMeters
          ? `${(s.placePrediction!.distanceMeters / 1000).toFixed(1)} km`
          : null,
      }));

    // Force a strict distance sort if the user's location is known
    if (location?.latitude != null && location?.longitude != null) {
      predictions.sort((a, b) => a.distanceMeters - b.distanceMeters);
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

Deno.serve(serve);
