import { getPlacePredictions } from "../searchService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("Search Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPlacePredictions", () => {
    it("calls the search-places edge function with input and sessionToken", async () => {
      const mockPredictions = [
        { description: "Pizza Hut, Berlin", placeId: "123" },
      ];

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: mockPredictions,
        error: null,
      });

      const result = await getPlacePredictions("Pizza", "session_token_123");

      expect(supabase.functions.invoke).toHaveBeenCalledWith("search-places", {
        body: { input: "Pizza", sessionToken: "session_token_123" },
      });
      expect(result).toEqual(mockPredictions);
    });
  });
});
