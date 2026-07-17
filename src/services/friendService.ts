import { supabase } from './supabase';
import { unlockDirectEvent } from './achievementService';
import {
  GroupFeedReview,
  UserProfile,
  UserRelationshipWithProfiles,
} from '../types';
import { Achievement } from '../types/achievements';

/**
 * Sends a friend request from one user to another.
 *
 * @param requesterId The ID of the user sending the request.
 * @param addresseeId The ID of the user receiving the request.
 * @throws Will throw an error if the database operation fails.
 */
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const { error } = await supabase.from('user_relationships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

/**
 * Accepts a pending friend request.
 * Returns any newly unlocked Achievement for the accepting user.
 *
 * @param relationshipId The unique ID of the friend request relationship.
 * @throws Will throw an error if the database operation fails.
 */
export async function acceptFriendRequest(
  relationshipId: string,
): Promise<Achievement | null> {
  // Fetch the relationship to get both user IDs before updating
  const { data: relationship, error: fetchError } = await supabase
    .from('user_relationships')
    .select('requester_id, addressee_id')
    .eq('id', relationshipId)
    .single();

  if (fetchError || !relationship) {
    const errorMessage = 'Failed to find friend request to accept.';
    console.error(errorMessage, fetchError);
    throw new Error(errorMessage);
  }

  const { error: updateError } = await supabase
    .from('user_relationships')
    .update({ status: 'accepted' })
    .eq('id', relationshipId);

  if (updateError) {
    console.error('Error accepting friend request:', updateError);
    throw updateError;
  }

  // Silently trigger the requester's achievement allocation background pass
  unlockDirectEvent('EVENT_SOCIAL_FRIEND', relationship.requester_id);

  // Return the active user's achievement resolution to the UI
  return await unlockDirectEvent(
    'EVENT_SOCIAL_FRIEND',
    relationship.addressee_id,
  );
}

/**
 * Rejects (deletes) a pending friend request.
 *
 * @param relationshipId The unique ID of the friend request relationship.
 * @throws Will throw an error if the database operation fails.
 */
export async function rejectFriendRequest(
  relationshipId: string,
): Promise<void> {
  const { error } = await supabase
    .from('user_relationships')
    .delete()
    .eq('id', relationshipId);

  if (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

/**
 * Retrieves all accepted friends for a given user, including their profile data.
 *
 * @param currentUserId The ID of the user whose friends are to be fetched.
 * @returns A promise that resolves to an array of UserRelationshipWithProfiles objects.
 * @throws Will throw an error if the database operation fails.
 */
export async function getFriends(
  currentUserId: string,
): Promise<UserRelationshipWithProfiles[]> {
  const { data, error } = await supabase
    .from('user_relationships')
    .select(
      `
      *,
      requester:profiles!requester_id(id, username, avatar_url),
      addressee:profiles!addressee_id(id, username, avatar_url)
    `,
    )
    .eq('status', 'accepted')
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

  if (error) {
    console.error('Error fetching friends:', error);
    throw error;
  }

  return (data as unknown as UserRelationshipWithProfiles[]) || [];
}

/**
 * Searches for users by their username.
 *
 * @param query The search query for the username.
 * @returns A promise that resolves to an array of UserProfile objects.
 * @throws Will throw an error if the database operation fails.
 */
export async function searchUsersByUsername(
  query: string,
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .ilike('username', `%${query}%`);

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches a chronological feed of public reviews from a user's accepted friends.
 *
 * @param currentUserId The ID of the user whose friend feed is being requested.
 * @returns A promise that resolves to an array of review objects.
 */
export async function fetchFriendTimeline(
  currentUserId: string,
): Promise<GroupFeedReview[]> {
  const friends = await getFriends(currentUserId);
  const friendIds = friends.map((friendship) =>
    friendship.requester_id === currentUserId
      ? friendship.addressee_id
      : friendship.requester_id,
  );

  if (friendIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      profiles!user_id(username, avatar_url),
      restaurant:restaurants(id, name, cuisine, google_place_id)
    `,
    )
    .in('user_id', friendIds)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(50); // Add a limit for performance

  if (error) {
    console.error('Error fetching friend timeline:', error);
    throw error;
  }

  return (data as unknown as GroupFeedReview[]) || [];
}
