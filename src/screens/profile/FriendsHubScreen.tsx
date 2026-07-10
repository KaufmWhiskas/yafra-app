import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import {
  searchUsersByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from '../../services/friendService';
import { useDebounce } from '../../hooks/useDebounce';
import { FriendProfile, UserProfile } from '../../types';
import { Avatar } from '../../components/Avatar';
import { COLORS, SIZES } from '../../constants/theme';
import FriendQRGenerator from '../../components/friends/FriendQRGenerator';
import FriendScanner from '../../components/friends/FriendScanner';
import Lucide from '@react-native-vector-icons/lucide';

type ActiveTab = 'friends' | 'requests' | 'find';

const UserRow: React.FC<{
  user: {
    avatar_url: string | null;
    username: string | null;
  };
  children?: React.ReactNode;
}> = ({ user, children }) => (
  <View style={styles.row}>
    <Avatar url={user.avatar_url} size={40} />
    <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
      {user.username || '...'}
    </Text>
    <View style={styles.actionsContainer}>{children}</View>
  </View>
);

const MyFriendsList = () => {
  const { friends, refetch } = useFriends();

  const handleRemoveFriend = (friend: FriendProfile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectFriendRequest(friend.relationshipId);
              refetch();
            } catch (error) {
              console.error('Failed to remove friend:', error);
              Alert.alert('Error', 'Could not remove friend.');
            }
          },
        },
      ],
    );
  };

  if (friends.length === 0) {
    return (
      <Text style={styles.emptyText}>You haven't added any friends yet.</Text>
    );
  }

  return (
    <View>
      {friends.map((friend) => (
        <UserRow key={friend.id} user={friend}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFriend(friend)}
          >
            <Lucide name="user-x" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </UserRow>
      ))}
    </View>
  );
};

const RequestsList = () => {
  const { pendingIncoming, pendingOutgoing, refetch } = useFriends();

  const handleAccept = async (relationshipId: string) => {
    try {
      await acceptFriendRequest(relationshipId);
      refetch();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDecline = async (relationshipId: string) => {
    try {
      await rejectFriendRequest(relationshipId);
      refetch();
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  return (
    <View>
      <Text style={styles.sectionHeader}>Received</Text>
      {pendingIncoming.length > 0 ? (
        pendingIncoming.map((req) => (
          <UserRow key={req.id} user={req.requester}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(req.id)}
            >
              <Lucide name="user-check" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDecline(req.id)}
            >
              <Lucide name="user-x" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </UserRow>
        ))
      ) : (
        <Text style={styles.emptyText}>No incoming requests.</Text>
      )}

      <Text style={styles.sectionHeader}>Sent</Text>
      {pendingOutgoing.length > 0 ? (
        pendingOutgoing.map((req) => (
          <UserRow key={req.id} user={req.addressee}>
            <View style={[styles.actionButton, styles.disabledButton]}>
              <Text style={styles.disabledButtonText}>Pending</Text>
            </View>
          </UserRow>
        ))
      ) : (
        <Text style={styles.emptyText}>No outgoing requests.</Text>
      )}
    </View>
  );
};

const FindPeople = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  const { friends, pendingIncoming, pendingOutgoing, refetch } = useFriends();
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  const pendingOutgoingIds = useMemo(
    () => new Set(pendingOutgoing.map((r) => r.addressee_id)),
    [pendingOutgoing],
  );
  const pendingIncomingRequests = useMemo(
    () => new Map(pendingIncoming.map((r) => [r.requester_id, r.id])),
    [pendingIncoming],
  );

  useEffect(() => {
    if (debouncedQuery.trim().length > 2 && currentUserId) {
      setIsSearching(true);
      searchUsersByUsername(debouncedQuery)
        .then((data) => setResults(data.filter((u) => u.id !== currentUserId)))
        .catch((e) => console.error('Search failed:', e))
        .finally(() => setIsSearching(false));
    } else {
      setResults([]);
    }
  }, [debouncedQuery, currentUserId]);

  if (!currentUserId) {
    // This case should ideally not be hit if the hub is behind an auth wall,
    // but it's a good safeguard.
    return null;
  }

  const handleAddFriend = async (targetId: string) => {
    try {
      await sendFriendRequest(currentUserId, targetId);
      refetch();
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    try {
      await acceptFriendRequest(relationshipId);
      refetch();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const renderActionButton = (user: UserProfile) => {
    if (friendIds.has(user.id)) {
      return (
        <View style={[styles.actionButton, styles.disabledButton]}>
          <Text style={styles.disabledButtonText}>Friends</Text>
        </View>
      );
    }
    if (pendingOutgoingIds.has(user.id)) {
      return (
        <View style={[styles.actionButton, styles.disabledButton]}>
          <Text style={styles.disabledButtonText}>Requested</Text>
        </View>
      );
    }
    const incomingRelationshipId = pendingIncomingRequests.get(user.id);
    if (incomingRelationshipId) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(incomingRelationshipId)}
        >
          <Text style={styles.actionButtonText}>Accept</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleAddFriend(user.id)}
      >
        <Text style={styles.actionButtonText}>Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {isSearching && <ActivityIndicator style={{ marginTop: 20 }} />}
      {results.map((user) => (
        <UserRow key={user.id} user={user}>
          {renderActionButton(user)}
        </UserRow>
      ))}
    </View>
  );
};

export default function FriendsHubScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [qrGeneratorVisible, setQrGeneratorVisible] = useState(false);
  const { session } = useAuth();
  const { friends, pendingIncoming, pendingOutgoing, isLoading, refetch } =
    useFriends();

  const renderContent = () => {
    // Show a full-screen loader only on the initial mount when data is being fetched
    // for the first time. Subsequent loading states (e.g., from pull-to-refresh)
    // are handled by the RefreshControl.
    if (
      isLoading &&
      !friends.length &&
      !pendingIncoming.length &&
      !pendingOutgoing.length
    ) {
      return (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={COLORS.primary}
        />
      );
    }
    switch (activeTab) {
      case 'friends':
        return <MyFriendsList />;
      case 'requests':
        return <RequestsList />;
      case 'find':
        return (
          <>
            <View style={styles.findPeopleHeader}>
              <TouchableOpacity
                style={styles.findPeopleButton}
                onPress={() => setScannerVisible(true)}
              >
                <Lucide name="scan-line" size={20} color={COLORS.primary} />
                <Text style={styles.findPeopleButtonText}>Scan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findPeopleButton}
                onPress={() => setQrGeneratorVisible(true)}
              >
                <Lucide name="qr-code" size={20} color={COLORS.primary} />
                <Text style={styles.findPeopleButtonText}>My Code</Text>
              </TouchableOpacity>
            </View>
            <FindPeople />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText,
            ]}
          >
            My Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.activeTab]}
          onPress={() => setActiveTab('find')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'find' && styles.activeTabText,
            ]}
          >
            Find People
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {renderContent()}
      </ScrollView>

      <Modal visible={scannerVisible} animationType="slide">
        <FriendScanner onClose={() => setScannerVisible(false)} />
      </Modal>

      <Modal
        visible={qrGeneratorVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {session?.user?.id && (
              <FriendQRGenerator currentUserId={session.user.id} />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrGeneratorVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { marginTop: 50 },
  segmentedControl: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.text, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  scrollContent: { padding: SIZES.padding },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  name: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.text,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textLight,
  },
  removeButton: { padding: 8 },
  acceptButton: { padding: 8 },
  declineButton: { padding: 8, marginLeft: 8 },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  actionButtonText: { color: '#fff', fontWeight: '600' },
  disabledButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledButtonText: { color: COLORS.textLight, fontWeight: '600' },
  searchInput: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  findPeopleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.padding,
  },
  findPeopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  findPeopleButtonText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    width: '85%',
    alignItems: 'center',
  },
  closeButton: { marginTop: 20, padding: 10 },
  closeButtonText: { color: COLORS.primary, fontWeight: 'bold' },
});
