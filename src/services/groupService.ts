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
 * Checks permanent group codes first, then one-time group invites.
 */
export async function joinGroupWithCode(
  userId: string,
  inviteCode: string,
): Promise<void> {
  let targetGroupId: string | null = null;
  let inviteIdToUpdate: string | null = null;
  let currentUsedCount: number = 0;

  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("permanent_invite_code", inviteCode)
    .maybeSingle();

  if (group) {
    targetGroupId = group.id;
  } else {
    const { data: invite, error: inviteError } = await supabase
      .from("group_invites")
      .select("id, group_id, max_uses, used_count, expires_at")
      .eq("code", inviteCode)
      .maybeSingle();

    if (inviteError || !invite) {
      throw new Error("Invalid or missing invite code");
    }

    if (invite.used_count >= invite.max_uses) {
      throw new Error("Invite code has reached its maximum uses");
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite code has expired");
    }

    targetGroupId = invite.group_id;
    inviteIdToUpdate = invite.id;
    currentUsedCount = invite.used_count;
  }

  if (!targetGroupId) throw new Error("Invalid or missing invite code");

  const { error: insertError } = await supabase
    .from("group_members")
    .insert([{ group_id: targetGroupId, user_id: userId, role: "member" }]);

  if (insertError) throw insertError;

  if (inviteIdToUpdate) {
    const { error: updateError } = await supabase
      .from("group_invites")
      .update({ used_count: currentUsedCount + 1 })
      .eq("id", inviteIdToUpdate);

    if (updateError) throw updateError;
  }
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

/**
 * Creates a one-time invite code for a group.
 *
 * @param groupId The ID of the group.
 * @param createdBy The user ID of the creator.
 * @returns The generated invite code.
 */
export async function createOneTimeInvite(
  groupId: string,
  createdBy: string,
): Promise<string> {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      created_by: createdBy,
      code: inviteCode,
      max_uses: 1,
    });

  if (error) throw error;
  return inviteCode;
}
