export async function fetchProDetails(placeId: string, apiKey: string) {
  const cleanPlaceId = placeId.replace(/^places\//, "");
  const url = `https://places.googleapis.com/v1/places/${cleanPlaceId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "rating,priceLevel,regularOpeningHours,reviews,location",
    },
  });
  return response.json();
}
