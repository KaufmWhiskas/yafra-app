import { fetchUserProfile, updateUsername } from "../authService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
}));

describe("Auth Service - User Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchUserProfile", () => {
    it("selects the profile for the given user ID", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({ data: { id: "123", username: "testuser" }, error: null });

      const result = await fetchUserProfile("123");

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(result).toEqual({ id: "123", username: "testuser" });
    });
  });

  describe("updateUsername", () => {
    it("updates the username for the given user ID", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({ data: { id: "123", username: "newname" }, error: null });

      const result = await updateUsername("123", "newname");

      // @ts-expect-error: custom mock property not on root client
      expect(supabase.update).toHaveBeenCalledWith({ username: "newname" });
      expect(result).toEqual({ id: "123", username: "newname" });
    });
  });
});