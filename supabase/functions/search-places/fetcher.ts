export interface Prediction {
  description: string;
  placeId: string;
}

interface GoogleSuggestion {
  placePrediction: {
    place: string;
    text: {
      text: string;
    };
  };
}

export interface SearchFetcher {
  fetchPredictions: (
    input: string,
    sessionToken: string,
    location?: { latitude: number; longitude: number },
  ) => Promise<Prediction[]>;
}

/**
 * Factory creating a search fetcher injected with the Google Places API key.
 */
export function createSearchFetcher(apiKey: string): SearchFetcher {
  return {
    fetchPredictions: async (
      input: string,
      sessionToken: string,
      location?: { latitude: number; longitude: number },
    ): Promise<Prediction[]> => {
      const url = "https://places.googleapis.com/v1/places:autocomplete";

      interface AutocompleteRequest {
        input: string;
        sessionToken: string;
        locationBias?: {
          circle: {
            center: { latitude: number; longitude: number };
            radius: number;
          };
        };
      }

      const requestBody: AutocompleteRequest = {
        input,
        sessionToken,
      };

      if (location) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radius: 50000.0,
          },
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return (data.suggestions || []).map((suggestion: GoogleSuggestion) => ({
        description: suggestion?.placePrediction?.text?.text ?? "",
        placeId: suggestion?.placePrediction?.place ?? "",
      }));
    },
  };
}
