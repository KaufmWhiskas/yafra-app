import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { getFriends } from '../services/friendService';
import { FriendProfile, UserRelationshipWithProfiles } from '../types';
import { useAuth } from './AuthContext';

interface FriendsContextType {
  friends: FriendProfile[];
  pendingIncoming: UserRelationshipWithProfiles[];
  pendingOutgoing: UserRelationshipWithProfiles[];
  isLoading: boolean;
  refetch: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

/**
 * Provides friend-related data to the application.
 * This includes lists of accepted friends, incoming pending requests,
 * and outgoing pending requests. It handles fetching and processing this data.
 */
export const FriendsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<
    UserRelationshipWithProfiles[]
  >([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<
    UserRelationshipWithProfiles[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const loadFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setPendingIncoming([]);
      setPendingOutgoing([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const relationships = await getFriends(userId);

      const friendsList: FriendProfile[] = [];
      const incoming: UserRelationshipWithProfiles[] = [];
      const outgoing: UserRelationshipWithProfiles[] = [];

      for (const rel of relationships) {
        if (rel.status === 'accepted') {
          const friendProfile =
            rel.requester_id === userId ? rel.addressee : rel.requester;
          friendsList.push({
            ...friendProfile,
            relationshipId: rel.id,
          });
        } else if (rel.status === 'pending') {
          if (rel.addressee_id === userId) {
            incoming.push(rel);
          } else {
            outgoing.push(rel);
          }
        }
      }

      setFriends(friendsList);
      setPendingIncoming(incoming);
      setPendingOutgoing(outgoing);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const value = {
    friends,
    pendingIncoming,
    pendingOutgoing,
    isLoading,
    refetch: loadFriends,
  };

  return (
    <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
  );
};

/**
 * Custom hook to access the FriendsContext.
 *
 * @returns The friends context including friends, pending requests, and loading state.
 */
export const useFriends = (): FriendsContextType => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
