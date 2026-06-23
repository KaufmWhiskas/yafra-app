import {
  fetchUserProfile,
  sendPasswordResetOtp,
  updateUsername,
  updateUserPassword,
  verifyResetOtp,
} from "../authService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    auth: {
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "123" } },
        error: null,
      }),
    },
  },
}));

describe("Auth Service - User Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchUserProfile", () => {
    it("selects the profile for the given user ID", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: "123", username: "testuser" },
        error: null,
      });

      const result = await fetchUserProfile("123");

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(result).toEqual({ id: "123", username: "testuser" });
    });
  });

  describe("updateUsername", () => {
    it("updates the username for the given user ID", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: "123", username: "newname" },
        error: null,
      });

      const result = await updateUsername("123", "newname");

      // @ts-expect-error: custom mock property not on root client
      expect(supabase.update).toHaveBeenCalledWith({ username: "newname" });
      expect(result).toEqual({ id: "123", username: "newname" });
    });
  });
});

describe("Auth Service - Password Reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendPasswordResetOtp", () => {
    it("calls supabase.auth.resetPasswordForEmail with the correct parameters", async () => {
      const email = "test@example.com";
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await sendPasswordResetOtp(email);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: undefined,
      });
    });

    it("throws an error if supabase returns an error", async () => {
      const errorMessage = "Unable to send reset email";
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: new Error(errorMessage),
      });

      await expect(sendPasswordResetOtp("test@example.com")).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe("verifyResetOtp", () => {
    it("calls supabase.auth.verifyOtp with the correct parameters", async () => {
      const email = "test@example.com";
      const token = "123456";
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await verifyResetOtp(email, token);

      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email,
        token,
        type: "recovery",
      });
    });
  });

  describe("updateUserPassword", () => {
    it("calls supabase.auth.updateUser with the new password", async () => {
      const newPassword = "newSecurePassword123";
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await updateUserPassword(newPassword);

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });
  });
});
