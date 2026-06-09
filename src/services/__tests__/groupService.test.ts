import {
  createGroup,
  fetchGroupDetails,
  fetchMyGroups,
  joinGroupWithCode,
  leaveGroup,
} from "../groupService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
}));

describe("Group Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchMyGroups returns a list of groups the user belongs to", async () => {
    // We mock a flat select() chain because the database RLS policies handle the actual
    // user filtering dynamically based on the session token, so the mock simply resolves
    // immediately with the simulated payload.
    // @ts-expect-error: custom mock property not on root client
    (supabase.select as jest.Mock).mockResolvedValueOnce({
      data: [{ id: "1", name: "Test Group" }],
      error: null,
    });

    const result = await fetchMyGroups("user_123");
    expect(result).toEqual([{ id: "1", name: "Test Group" }]);
    expect(supabase.from).toHaveBeenCalledWith("groups");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.select).toHaveBeenCalledWith("*");
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

  it("joinGroupWithCode inserts a new group_member record when a valid code is provided", async () => {
    // The query requires two sequential database operations. We mock the first single()
    // call to return the group resolution, and the subsequent insert() call to succeed without errors.
    // @ts-expect-error: custom mock property not on root client
    (supabase.single as jest.Mock).mockResolvedValueOnce({
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
    expect(supabase.select).toHaveBeenCalledWith("*, members:group_members(*)");
    // @ts-expect-error: custom mock property not on root client
    expect(supabase.eq).toHaveBeenCalledWith("id", "1");
  });
});
