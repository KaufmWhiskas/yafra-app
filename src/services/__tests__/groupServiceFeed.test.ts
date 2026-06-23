import { fetchGroupFeed } from "../groupService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Cast the mock to the correct type
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("fetchGroupFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches feed reviews from group members and respects private review visibility", async () => {
    const membersResult = {
      data: [{ user_id: "user_1" }, { user_id: "user_2" }],
      error: null,
    };
    const reviewsResult = {
      data: [
        {
          id: 1,
          user_id: "user_1",
          rating: 4,
          review_text: "Great pizza",
          is_private: false,
          created_at: "2025-06-18T12:00:00Z",
          profiles: { username: "Alice" },
          restaurant: { id: "rest1", name: "Pizzeria", cuisine: "italian" },
        },
        {
          id: 2,
          user_id: "user_2",
          rating: 5,
          review_text: "Loved it",
          is_private: true,
          created_at: "2025-06-18T13:00:00Z",
          profiles: { username: "Bob" },
          restaurant: { id: "rest2", name: "Sushi Bar", cuisine: "japanese" },
        },
      ],
      error: null,
    };

    // Mock the chain for from('table').select()...
    (mockSupabase.from as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "group_members") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue(membersResult),
        };
      }
      if (tableName === "reviews") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue(reviewsResult),
        };
      }
    });

    const result = await fetchGroupFeed("group_1", "user_1");

    expect(result).toHaveLength(2);
    expect(result[0].profiles?.username).toBe("Alice");
    expect(result[1].profiles?.username).toBe("Bob");
  });
});
