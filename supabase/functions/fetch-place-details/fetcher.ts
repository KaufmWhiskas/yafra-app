interface GooglePlaceReview {
  authorAttribution?: { displayName?: string };
  rating?: number;
  text?: { text?: string };
  publishTime?: string;
}

export async function fetchProDetails(placeId: string, apiKey: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "rating,priceLevel,regularOpeningHours,currentOpeningHours,reviews,location,displayName,primaryType",
    },
  });

  const data = await response.json();

  const google_reviews = data.reviews?.map((r: GooglePlaceReview) => ({
    author_name: r.authorAttribution?.displayName ?? "Unknown",
    rating: r.rating ?? 0,
    text: r.text?.text ?? "",
    time: r.publishTime ?? "",
  })) || [];

  return {
    ...data,
    name: data.displayName?.text ?? "Unknown",
    cuisine: data.primaryType ?? "",
    opening_hours: data.regularOpeningHours?.weekdayDescriptions ||
      data.currentOpeningHours?.weekdayDescriptions || undefined,
    google_reviews,
  };
}
