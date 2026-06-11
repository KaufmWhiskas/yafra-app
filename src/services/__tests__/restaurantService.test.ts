import {
  fetchRestaurantDetails,
  fetchRestaurants,
  triggerIngest,
} from "../restaurantService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("Restaurant Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchRestaurants", () => {
    it("fetchRestaurants maps google_rating to rating and parses strings to numbers", async () => {
      const mockDbData = [
        {
          id: "1",
          name: "Piccola Italia",
          google_rating: "4.6", // DB returns string
          app_rating: "3.4", // DB returns string
        },
      ];

      // Setup the mock chain to resolve with our fake DB data
      // Since .lte() is called twice, the first call must continue the chain,
      // and the second call must resolve the promise with our data.
      // @ts-expect-error: lte is a custom mock property not on the root client
      (supabase.lte as jest.Mock).mockReturnValueOnce(supabase)
        .mockResolvedValueOnce({
          data: mockDbData,
          error: null,
        });

      const bbox = { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
      const result = await fetchRestaurants(bbox);

      // Assert the data was transformed correctly for the frontend
      expect(result[0].rating).toBe(4.6);
      expect(result[0].app_rating).toBe(3.4);
      // @ts-expect-error: We are explicitly testing that this stripped property does not leak
      expect(result[0].google_rating).toBeUndefined();
    });
  });
});

describe("triggerIngest", () => {
  it("invokes the ingest-restaurants edge function with the correct bounding box", async () => {
    const bbox = { minLat: 47.3, minLon: 8.5, maxLat: 47.4, maxLon: 8.6 };
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { message: "Scan complete" },
      error: null,
    });

    await triggerIngest(bbox);

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "ingest-restaurants",
      {
        body: { bbox },
      },
    );
  });

  it("throws an error if the edge function invocation fails", async () => {
    const bbox = { minLat: 47.3, minLon: 8.5, maxLat: 47.4, maxLon: 8.6 };
    const errorMessage = "Function invocation failed";

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    await expect(triggerIngest(bbox)).rejects.toThrow(errorMessage);
  });
});

describe("fetchRestaurantDetails", () => {
  it("invokes the fetch-place-details edge function with the correct googlePlaceId", async () => {
    const mockDetails = { rating: 4.5, price_level: 2, user_ratings_total: 0 };
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: mockDetails,
      error: null,
    });

    const result = await fetchRestaurantDetails("place_123");

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "fetch-place-details",
      {
        body: { googlePlaceId: "place_123" },
      },
    );
    expect(result).toEqual(mockDetails);
  });
});
