import { supabase } from "./supabase";
import { Group } from "../types";

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
  const { data, error } = await supabase
    .from("groups")
    .insert({ name, created_by: userId })
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
