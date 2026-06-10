import {
  createGroup,
  createOneTimeInvite,
  deleteGroup,
  fetchGroupDetails,
  fetchGroupRestaurants,
  fetchGroupReviewedRestaurantIds,
  fetchMyGroups,
  joinGroupWithCode,
  leaveGroup,
  removeGroupMember,
  updateMemberRole,
  updatePermanentInvite,
} from "../groupService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  },
}));

describe("Group Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchMyGroups returns a list of groups the user belongs to", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "1", name: "Test Group" }],
      error: null,
    });

    const result = await fetchMyGroups("user_123");

    expect(result).toEqual([{ id: "1", name: "Test Group" }]);
    expect(supabase.from).toHaveBeenCalledWith("groups");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.select).toHaveBeenCalledWith(
      "*, group_members!inner(user_id)",
    );
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith(
      "group_members.user_id",
      "user_123",
    );
  });

  it("createGroup inserts a new group and returns the created record", async () => {
    // We structure the mock chain to resolve on single() to simulate PostgREST's
    // behavior of returning the newly inserted record rather than a generic success array.
    // @ts-expect-error: custom mock property not on root client
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: { id: "2", name: "New Group" },
      error: null,
    });

    const result = await createGroup("user_123", "New Group");
    expect(result).toEqual({ id: "2", name: "New Group" });
    expect(supabase.from).toHaveBeenCalledWith("groups");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Group",
        created_by: "user_123",
        permanent_invite_code: expect.any(String),
      }),
    );
  });

  it("joinGroupWithCode inserts a new group_member record when a valid permanent code is provided", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
      data: { id: "group_1" },
      error: null,
    });
    // @ts-expect-error: custom mock property not on root client
    (supabase.insert as jest.Mock).mockResolvedValueOnce({ error: null });

    await joinGroupWithCode("user_123", "INVITE123");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith(
      "permanent_invite_code",
      "INVITE123",
    );
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.insert).toHaveBeenCalledWith([{
      group_id: "group_1",
      user_id: "user_123",
      role: "member",
    }]);
  });

  it("joinGroupWithCode handles one-time invite codes correctly", async () => {
    // First maybeSingle for permanent code returns null
    // @ts-expect-error: custom mock property not on root client
    (supabase.maybeSingle as jest.Mock)
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "invite_1",
          group_id: "group_1",
          max_uses: 1,
          used_count: 0,
        },
        error: null,
      });

    // @ts-expect-error: custom mock property not on root client
    (supabase.insert as jest.Mock).mockResolvedValueOnce({ error: null });

    // FIX: update() must return the mock chain (supabase) so eq() can be called.
    // Then eq() resolves the final promise after returning the chain for the first two queries.
    // @ts-expect-error: custom mock property not on root client
    (supabase.update as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock)
      .mockReturnValueOnce(supabase)
      .mockReturnValueOnce(supabase)
      .mockResolvedValueOnce({ error: null });

    await joinGroupWithCode("user_123", "TEMP123");

    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("code", "TEMP123");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.insert).toHaveBeenCalledWith([{
      group_id: "group_1",
      user_id: "user_123",
      role: "member",
    }]);
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.update).toHaveBeenCalledWith({ used_count: 1 });
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("id", "invite_1");
  });

  it("createOneTimeInvite inserts a row into the group_invites table and returns the code", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock).mockResolvedValueOnce({ data: [], error: null });
    // @ts-expect-error: custom mock property not on root client
    (supabase.insert as jest.Mock).mockResolvedValueOnce({ error: null });

    const result = await createOneTimeInvite("group_1", "user_123");

    expect(result).toEqual(expect.any(String));
    expect(result.length).toBe(6);
    expect(supabase.from).toHaveBeenCalledWith("group_invites");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        group_id: "group_1",
        created_by: "user_123",
        code: expect.any(String),
        max_uses: 1,
        expires_at: expect.any(String),
      }),
    );
  });

  it("leaveGroup deletes the group_member record for the active user", async () => {
    // We construct the mock to return 'this' for the first eq() filter constraint,
    // and resolve the Promise payload on the final eq() call to complete the chained composite key deletion.
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock).mockReturnValueOnce(supabase)
      .mockResolvedValueOnce({ error: null });

    await leaveGroup("user_123", "group_1");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("group_id", "group_1");
  });

  it("fetchGroupDetails returns a group with its members", async () => {
    // We structure the mock chain to resolve on single() for the relational query
    // @ts-expect-error: custom mock property not on root client
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: { id: "1", name: "Test Group", members: [{ user_id: "u1" }] },
      error: null,
    });

    const result = await fetchGroupDetails("1");

    expect(result).toEqual({
      id: "1",
      name: "Test Group",
      members: [{ user_id: "u1" }],
    });
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.select).toHaveBeenCalledWith(`
      *, 
      members:group_members(
        *,
        profiles(username)
      )
    `);
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("id", "1");
  });

  it("deleteGroup deletes the group record", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.delete as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock).mockResolvedValueOnce({ error: null });

    await deleteGroup("group_1");

    expect(supabase.from).toHaveBeenCalledWith("groups");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.delete).toHaveBeenCalled();
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("id", "group_1");
  });

  it("updatePermanentInvite updates the code for the group", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.update as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock).mockResolvedValueOnce({ error: null });

    await updatePermanentInvite("group_1", "NEW123");

    expect(supabase.from).toHaveBeenCalledWith("groups");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.update).toHaveBeenCalledWith({
      permanent_invite_code: "NEW123",
    });
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("id", "group_1");
  });

  it("updateMemberRole updates the role of the specified member", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.update as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock)
      .mockReturnValueOnce(supabase)
      .mockResolvedValueOnce({ error: null });

    await updateMemberRole("group_1", "user_123", "admin");

    expect(supabase.from).toHaveBeenCalledWith("group_members");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.update).toHaveBeenCalledWith({ role: "admin" });
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("group_id", "group_1");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");
  });

  it("removeGroupMember deletes the specified member", async () => {
    // @ts-expect-error: custom mock property not on root client
    (supabase.delete as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock property not on root client
    (supabase.eq as jest.Mock)
      .mockReturnValueOnce(supabase)
      .mockResolvedValueOnce({ error: null });

    await removeGroupMember("group_1", "user_123");

    expect(supabase.from).toHaveBeenCalledWith("group_members");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.delete).toHaveBeenCalled();
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("group_id", "group_1");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");
  });

  it("fetchGroupReviewedRestaurantIds returns a unique set of restaurant IDs reviewed by any group member", async () => {
    // Mock Step 1: fetch group members
    // @ts-expect-error: custom mock
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock
    (supabase.eq as jest.Mock).mockResolvedValueOnce({
      data: [{ user_id: "user_1" }, { user_id: "user_2" }],
      error: null,
    });

    // Mock Step 2: fetch reviews using .in()
    // @ts-expect-error: custom mock
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock
    (supabase.in as jest.Mock).mockResolvedValueOnce({
      data: [{ restaurant_id: "r1" }, { restaurant_id: "r2" }, {
        restaurant_id: "r2",
      }],
      error: null,
    });

    const result = await fetchGroupReviewedRestaurantIds("group_1");

    expect(supabase.from).toHaveBeenNthCalledWith(1, "group_members");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "reviews");
    // @ts-expect-error: custom mock
    expect(supabase.in).toHaveBeenCalledWith("user_id", ["user_1", "user_2"]);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has("r1")).toBe(true);
    expect(result.has("r2")).toBe(true);
  });

  it("fetchGroupRestaurants returns a list of restaurant details for the group", async () => {
    // @ts-expect-error: custom mock
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock
    (supabase.eq as jest.Mock).mockResolvedValueOnce({
      data: [{ user_id: "user_1" }],
      error: null,
    });

    // @ts-expect-error: custom mock
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock
    (supabase.in as jest.Mock).mockResolvedValueOnce({
      data: [{ restaurant_id: "r1" }],
      error: null,
    });

    // @ts-expect-error: custom mock
    (supabase.select as jest.Mock).mockReturnValueOnce(supabase);
    // @ts-expect-error: custom mock
    (supabase.in as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "r1", name: "Saved Pizza" }],
      error: null,
    });

    const result = await fetchGroupRestaurants("group_1");

    expect(supabase.from).toHaveBeenNthCalledWith(3, "restaurants");
    // @ts-expect-error: custom mock
    expect(supabase.in).toHaveBeenNthCalledWith(2, "id", ["r1"]);
    expect(result).toEqual([{ id: "r1", name: "Saved Pizza" }]);
  });
});
