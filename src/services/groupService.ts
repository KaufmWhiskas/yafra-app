import { supabase } from "./supabase";
import {
  Group,
  GroupFeedReview,
  GroupInvite,
  GroupMember,
  GroupRole,
  Restaurant,
} from "../types";

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

/**
 * Retrieves all unique restaurant IDs reviewed by any member of a specific group.
 * Utilizes PostgREST relational joins to traverse from group_members -> profiles -> reviews.
 */
export async function fetchGroupReviewedRestaurantIds(
  groupId: string,
): Promise<Set<string>> {
  const { data: members, error: memberError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (memberError) throw memberError;
  if (!members || members.length === 0) return new Set();

  const userIds = members.map((m) => m.user_id);

  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select("restaurant_id")
    .in("user_id", userIds);

  if (reviewError) throw reviewError;

  const restaurantIds = new Set<string>();
  for (const r of (reviews || [])) {
    if (r.restaurant_id) restaurantIds.add(r.restaurant_id.toString());
  }

  return restaurantIds;
}

export async function fetchGroupRestaurants(
  groupId: string,
): Promise<Restaurant[]> {
  const idsSet = await fetchGroupReviewedRestaurantIds(groupId);
  if (idsSet.size === 0) return [];

  const idsArray = Array.from(idsSet);

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .in("id", idsArray);

  if (error) throw error;
  return data as Restaurant[];
}

export async function fetchGroupFeed(
  groupId: string,
  currentUserId: string | null,
): Promise<GroupFeedReview[]> {
  // 1. Get member IDs
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (membersError) {
    console.error("fetchGroupFeed - Members Error:", membersError);
    throw new Error(membersError.message);
  }

  const memberRows = (members || []) as { user_id: string }[];
  const userIds = memberRows.map((member) => member.user_id);
  if (userIds.length === 0) return [];

  // 2. Fetch reviews and related data
  let query = supabase
    .from("reviews")
    .select(`
      *, 
      profiles(username, avatar_url), 
      restaurant:restaurants(id, name, cuisine)
    `)
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  // 3. Privacy Filter: Include if NOT private, OR if the current user wrote it
  if (currentUserId) {
    query = query.or(
      `is_private.eq.false,is_private.is.null,user_id.eq.${currentUserId}`,
    );
  } else {
    query = query.or(`is_private.eq.false,is_private.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchGroupFeed - Reviews Error:", error);
    // Throwing a standard JS Error ensures our hook's catch block reads the message
    throw new Error(error.message);
  }

  return data as GroupFeedReview[];
}

export async function fetchSharedGroupMemberIds(
  currentUserId: string,
): Promise<Set<string>> {
  // 1. Find all groups the current user is in
  const { data: groupMemberships, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", currentUserId);

  if (membershipError) {
    console.error(
      "Supabase Error fetching group memberships:",
      membershipError,
    );
    throw new Error(membershipError.message);
  }
  if (!groupMemberships || groupMemberships.length === 0) {
    return new Set();
  }

  const groupIds = groupMemberships.map((gm) => gm.group_id);

  // 2. Find all members of those groups
  const { data: allMembers, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .in("group_id", groupIds);

  if (membersError) {
    console.error("Supabase Error fetching shared members:", membersError);
    throw new Error(membersError.message);
  }

  const sharedUserIds = new Set(allMembers?.map((m) => m.user_id) || []);
  sharedUserIds.delete(currentUserId);
  return sharedUserIds;
}
