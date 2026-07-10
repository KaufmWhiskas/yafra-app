import { supabase } from './supabase';
import { UserRelationshipWithProfiles } from '../types';

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
 *
 * @param relationshipId The unique ID of the friend request relationship.
 * @throws Will throw an error if the database operation fails.
 */
export async function acceptFriendRequest(
  relationshipId: string,
): Promise<void> {
  const { error } = await supabase
    .from('user_relationships')
    .update({ status: 'accepted' })
    .eq('id', relationshipId);

  if (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
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
      requester:profiles!requester_id(id, username, display_name, avatar_url),
      addressee:profiles!addressee_id(id, username, display_name, avatar_url)
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
