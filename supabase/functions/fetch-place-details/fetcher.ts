export async function fetchProDetails(placeId: string, apiKey: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "rating,priceLevel,regularOpeningHours,reviews,location,displayName,primaryType",
    },
  });

  const data = await response.json();
  return {
    ...data,
    name: data.displayName?.text ?? "Unknown",
    cuisine: data.primaryType ?? "",
  };
}
