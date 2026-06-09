import { supabase } from "./supabase";
import { Group, GroupInvite, GroupMember, GroupRole } from "../types";

/**
 * Retrieves all groups the authenticated user is a member of.
 * Relies on Row Level Security (RLS) to inherently filter results.
 */
export async function fetchMyGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members!inner(user_id)")
    .eq("group_members.user_id", userId);

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
 * Deletes a group entirely.
 * Relies on ON DELETE CASCADE in the database to wipe associated members/invites.
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) throw error;
}

/**
 * Enables or disables the permanent invite code for a group.
 */
export async function updatePermanentInvite(
  groupId: string,
  code: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("groups")
    .update({ permanent_invite_code: code })
    .eq("id", groupId);

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
  return data as unknown as Group & {
    members: (GroupMember & { profiles: { username: string } })[];
  };
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
  const { data: activeInvites, error: countError } = await supabase
    .from("group_invites")
    .select("id, used_count, max_uses, expires_at")
    .eq("group_id", groupId);

  if (countError) throw countError;

  const currentCount = (activeInvites || []).filter(
    (inv) =>
      inv.used_count < inv.max_uses &&
      (!inv.expires_at || new Date(inv.expires_at) > new Date()),
  ).length;

  if (currentCount >= 10) {
    throw new Error("Maximum of 10 active invites reached.");
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString();

  const { error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      created_by: createdBy,
      code: inviteCode,
      max_uses: 1,
      expires_at: expiresAt,
    });

  if (error) throw error;
  return inviteCode;
}

/**
 * Retrieves active one-time invite codes for a specific group.
 */
export async function fetchActiveInvites(
  groupId: string,
): Promise<GroupInvite[]> {
  const { data, error } = await supabase
    .from("group_invites")
    .select(`*, profiles(username)`)
    .eq("group_id", groupId);

  if (error) throw error;

  const invites = (data || []) as unknown as GroupInvite[];
  return invites.filter(
    (inv) =>
      inv.used_count < inv.max_uses &&
      (!inv.expires_at || new Date(inv.expires_at) > new Date()),
  );
}

/**
 * Updates the role of a specific member in a group.
 *
 * @param groupId The ID of the group.
 * @param targetUserId The ID of the user whose role is being updated.
 * @param role The new role to assign to the user.
 */
export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  role: GroupRole,
): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) throw error;
}

/**
 * Removes a specific member from a group.
 *
 * @param groupId The ID of the group.
 * @param targetUserId The ID of the user to be removed.
 */
export async function removeGroupMember(
  groupId: string,
  targetUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) throw error;
}
