import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { FriendsProvider, useFriends } from '../FriendsContext';
import { getFriends } from '../../services/friendService';
import { useAuth } from '../AuthContext';
import { UserRelationshipWithProfiles } from '../../types';

// Mock dependencies
jest.mock('../../services/friendService');
jest.mock('../AuthContext');

const mockGetFriends = getFriends as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

const TestConsumer: React.FC = () => {
  const { friends, pendingIncoming, pendingOutgoing, isLoading } = useFriends();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <Text testID="friends-count">{friends.length}</Text>
      <Text testID="incoming-count">{pendingIncoming.length}</Text>
      <Text testID="outgoing-count">{pendingOutgoing.length}</Text>

      {friends.map((f) => (
        <Text key={f.id} testID={`friend-${f.id}`}>
          {f.username}
        </Text>
      ))}
      {pendingIncoming.map((r) => (
        <Text key={r.id} testID={`incoming-${r.id}`}>
          {r.requester.username}
        </Text>
      ))}
      {pendingOutgoing.map((r) => (
        <Text key={r.id} testID={`outgoing-${r.id}`}>
          {r.addressee.username}
        </Text>
      ))}
    </View>
  );
};

describe('FriendsProvider', () => {
  const currentUserId = 'user_me';
  const mockRelationships: UserRelationshipWithProfiles[] = [
    // Case 1: I am the requester, it's accepted -> Friend is 'addressee'
    {
      id: 'rel_1',
      requester_id: currentUserId,
      addressee_id: 'friend_1',
      status: 'accepted',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      requester: {
        id: currentUserId,
        username: 'Me',
        display_name: 'Me',
        avatar_url: null,
      },
      addressee: {
        id: 'friend_1',
        username: 'Friend One',
        display_name: 'Friend One',
        avatar_url: null,
      },
    },
    // Case 2: I am the addressee, it's accepted -> Friend is 'requester'
    {
      id: 'rel_2',
      requester_id: 'friend_2',
      addressee_id: currentUserId,
      status: 'accepted',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      requester: {
        id: 'friend_2',
        username: 'Friend Two',
        display_name: 'Friend Two',
        avatar_url: null,
      },
      addressee: {
        id: currentUserId,
        username: 'Me',
        display_name: 'Me',
        avatar_url: null,
      },
    },
    // Case 3: I am the addressee, it's pending -> Incoming request
    {
      id: 'rel_3',
      requester_id: 'pending_1',
      addressee_id: currentUserId,
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      requester: {
        id: 'pending_1',
        username: 'Pending One',
        display_name: 'Pending One',
        avatar_url: null,
      },
      addressee: {
        id: currentUserId,
        username: 'Me',
        display_name: 'Me',
        avatar_url: null,
      },
    },
    // Case 4: I am the requester, it's pending -> Outgoing request
    {
      id: 'rel_4',
      requester_id: currentUserId,
      addressee_id: 'pending_2',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      requester: {
        id: currentUserId,
        username: 'Me',
        display_name: 'Me',
        avatar_url: null,
      },
      addressee: {
        id: 'pending_2',
        username: 'Pending Two',
        display_name: 'Pending Two',
        avatar_url: null,
      },
    },
  ];

  it('correctly sorts relationships into friends and incoming/outgoing requests', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: currentUserId } } });
    mockGetFriends.mockResolvedValue(mockRelationships);

    const { getByTestId, queryByText } = render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    expect(getByTestId('friends-count').props.children).toBe(2);
    expect(getByTestId('incoming-count').props.children).toBe(1);
    expect(getByTestId('outgoing-count').props.children).toBe(1);

    expect(getByTestId('friend-friend_1')).toBeTruthy();
    expect(getByTestId('friend-friend_2')).toBeTruthy();
    expect(getByTestId('incoming-rel_3')).toBeTruthy();
    expect(getByTestId('outgoing-rel_4')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: currentUserId } } });
    mockGetFriends.mockRejectedValue(new Error('API Error'));

    const { getByTestId, queryByText } = render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    // State should be empty after an error
    expect(getByTestId('friends-count').props.children).toBe(0);
    expect(getByTestId('incoming-count').props.children).toBe(0);
    expect(getByTestId('outgoing-count').props.children).toBe(0);
  });

  it('provides empty arrays when no user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ session: null }); // No user session
    mockGetFriends.mockResolvedValue([]);

    const { getByTestId, queryByText } = render(
      <FriendsProvider>
        <TestConsumer />
      </FriendsProvider>,
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    expect(getByTestId('friends-count').props.children).toBe(0);
    expect(getByTestId('incoming-count').props.children).toBe(0);
    expect(getByTestId('outgoing-count').props.children).toBe(0);
  });
});
