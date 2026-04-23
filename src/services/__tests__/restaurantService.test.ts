import { fetchRestaurants, triggerIngest } from "../restaurantService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
    })),
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
    it("fetches and returns a list of restaurants successfully", async () => {
      const mockRestaurants = [
        {
          id: "1",
          name: "Pizza Palace",
          cuisine: "Italian",
          rating: 4.5,
        },
        {
          id: "2",
          name: "Sushi Spot",
          cuisine: "Japanese",
          rating: 4.8,
        },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockRestaurants,
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await fetchRestaurants();

      expect(supabase.from).toHaveBeenCalledWith("restaurants");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(result).toEqual(mockRestaurants);
    });

    it("throws an error if the database query fails", async () => {
      const errorMessage = "Database connection failed";

      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(fetchRestaurants()).rejects.toThrow(errorMessage);
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
});
