import { supabase } from "./supabase";
import { Group, GroupMember } from "../types";

/**
 * Retrieves all groups the authenticated user is a member of.
 * Relies on Row Level Security (RLS) to inherently filter results.
 */
export async function fetchMyGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase.from("groups").select("*");

  if (error) throw error;
  return data as Group[];
}

/**
 * Creates a new group.
 * The database trigger `trigger_auto_add_owner` automatically adds the creator as a group_member.
 */
export async function createGroup(
  userId: string,
  name: string,
): Promise<Group> {
  // Generate a random 6-character alphanumeric code (e.g., "A7X9BQ")
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      created_by: userId,
      permanent_invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Group;
}

/**
 * Allows a user to join a group using a permanent invite code.
 */
export async function joinGroupWithCode(
  userId: string,
  inviteCode: string,
): Promise<void> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("permanent_invite_code", inviteCode)
    .single();

  if (groupError || !group) throw new Error("Invalid or missing invite code");

  const { error: insertError } = await supabase
    .from("group_members")
    .insert([{ group_id: group.id, user_id: userId, role: "member" }]);

  if (insertError) throw insertError;
}

/**
 * Removes the user from a group.
 */
export async function leaveGroup(
  userId: string,
  groupId: string,
): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("user_id", userId)
    .eq("group_id", groupId);

  if (error) throw error;
}

/**
 * Retrieves a group and all its active members in a single query.
 * Utilizes Supabase's foreign key projection to append the relational array.
 */
export async function fetchGroupDetails(
  groupId: string,
): Promise<
  Group & { members: (GroupMember & { profiles: { username: string } })[] }
> {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *, 
      members:group_members(
        *,
        profiles(username)
      )
    `)
    .eq("id", groupId)
    .single();

  if (error) throw error;
  return data as any; // We cast to any here purely because Supabase nested types get highly complex, we will rely on the Promise return type.
}
