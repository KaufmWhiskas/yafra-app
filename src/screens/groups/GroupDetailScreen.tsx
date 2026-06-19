import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fetchGroupDetails,
  createOneTimeInvite,
  fetchActiveInvites,
  deleteGroup,
  updatePermanentInvite,
  updateMemberRole,
  removeGroupMember,
  fetchGroupRestaurants,
} from '../../services/groupService';
import { Group, GroupMember, GroupInvite, Restaurant } from '../../types';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

type GroupDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupDetailScreen'
>;
type GroupWithMembers = Group & {
  members: (GroupMember & { profiles: { username: string } })[];
};

export default function GroupDetailScreen() {
  const route = useRoute<GroupDetailScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groupId } = route.params;

  const { session } = useAuth();
  const user = session?.user;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempCode, setTempCode] = useState<string | null>(null);
  const [activeInvites, setActiveInvites] = useState<GroupInvite[]>([]);
  const [groupRestaurants, setGroupRestaurants] = useState<Restaurant[]>([]);

  const insets = useSafeAreaInsets();
  const [isQrModalVisible, setQrModalVisible] = useState(false);

  const handleShare = async () => {
    if (!group?.permanent_invite_code) return;
    try {
      await Share.share({
        message: `Join my food review group "${group.name}" on YAFRA! Enter invitation code: ${group.permanent_invite_code}`,
      });
    } catch (error) {
      console.error('Failed to trigger native share sheet:', error);
    }
  };

  const loadGroupDetails = useCallback(async () => {
    try {
      const data = await fetchGroupDetails(groupId);
      setGroup(data);
      if (user?.id === data.created_by) {
        const invites = await fetchActiveInvites(groupId);
        setActiveInvites(invites);
      }

      const restaurants = await fetchGroupRestaurants(groupId);
      setGroupRestaurants(restaurants);
    } catch (error) {
      console.error('Failed to load group details', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadGroupDetails();
    }, [loadGroupDetails]),
  );

  const handleGenerateTempInvite = async () => {
    if (!user?.id) return;
    try {
      const code = await createOneTimeInvite(groupId, user.id);
      setTempCode(code);
      const invites = await fetchActiveInvites(groupId);
      setActiveInvites(invites);
    } catch (error) {
      const err = error as Error;
      console.warn('Operational bound reached: ', err.message);
      Alert.alert(
        'Cannot Generate Invite',
        err.message || 'An unknown error occurred.',
      );
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert('Delete Group', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(groupId);
            navigation.navigate('MainTabs');
          } catch (error) {
            console.error('Failed to delete group', error);
          }
        },
      },
    ]);
  };

  const handleTogglePermanentCode = async () => {
    try {
      if (group?.permanent_invite_code) {
        await updatePermanentInvite(groupId, null);
      } else {
        const newCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        await updatePermanentInvite(groupId, newCode);
      }
      loadGroupDetails();
    } catch (error) {
      console.error('Failed to toggle code', error);
    }
  };

  const currentUserRole = group?.members.find(
    (m) => m.user_id === user?.id,
  )?.role;

  const handleMemberPress = (
    member: GroupMember & { profiles: { username: string } },
  ) => {
    if (!user?.id) return;
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;
    if (member.user_id === user.id) return; // Prevent modifying self

    const actions: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress: () => void;
    }[] = [];

    // 1. Dynamic Promotion Boundaries
    if (member.role === 'member') {
      actions.push({
        text: 'Promote to Trusted',
        onPress: async () => {
          try {
            await updateMemberRole(groupId, member.user_id, 'trusted');
            loadGroupDetails();
          } catch (error) {
            console.warn('Failed to promote member:', error);
          }
        },
      });
    }

    if (member.role === 'member' || member.role === 'trusted') {
      actions.push({
        text: 'Promote to Admin',
        onPress: () => {
          // Double Safety Confirmation
          Alert.alert(
            'Confirm Promotion',
            `Are you sure you want to make ${member.profiles?.username || member.user_id} an Admin?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Promote',
                onPress: async () => {
                  try {
                    await updateMemberRole(groupId, member.user_id, 'admin');
                    loadGroupDetails();
                  } catch (error) {
                    console.warn('Failed to promote member:', error);
                  }
                },
              },
            ],
          );
        },
      });
    }

    // 2. Dynamic Demotion Boundaries
    if (member.role === 'admin' || member.role === 'trusted') {
      actions.push({
        text: 'Demote to Member',
        onPress: async () => {
          try {
            await updateMemberRole(groupId, member.user_id, 'member');
            loadGroupDetails();
          } catch (error) {
            console.warn('Failed to demote member:', error);
          }
        },
      });
    }

    // 3. Destructive Eviction Bound (Admins cannot kick owners)
    if (member.role !== 'owner') {
      actions.push({
        text: 'Kick from Group',
        style: 'destructive',
        onPress: () => {
          // Double Safety Confirmation
          Alert.alert(
            'Confirm Kick',
            `Are you sure you want to remove ${member.profiles?.username || member.user_id} from the group?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Kick',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await removeGroupMember(groupId, member.user_id);
                    loadGroupDetails();
                  } catch (error) {
                    console.warn('Failed to kick member:', error);
                  }
                },
              },
            ],
          );
        },
      });
    }

    actions.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert(
      'Manage Member',
      `What would you like to do with ${member.profiles?.username || member.user_id}?`,
      actions,
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading group details...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>Group not found.</Text>
      </View>
    );
  }

  const isOwner = user?.id === group.created_by;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>
            Code: {group.permanent_invite_code || 'Disabled'}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {group.permanent_invite_code && (
              <TouchableOpacity style={styles.copyButton}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            )}
            {isOwner && (
              <TouchableOpacity
                style={[styles.copyButton, { marginLeft: 8 }]}
                onPress={handleTogglePermanentCode}
              >
                <Text style={styles.copyButtonText}>
                  {group.permanent_invite_code ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {group.permanent_invite_code ? (
          <View style={styles.inviteActionRow}>
            <TouchableOpacity style={styles.inviteButton} onPress={handleShare}>
              <MaterialCommunityIcons
                name="export-variant"
                size={20}
                color="#fff"
              />
              <Text style={styles.inviteButtonText}>Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setQrModalVisible(true)}
            >
              <MaterialCommunityIcons name="qrcode" size={20} color="#fff" />
              <Text style={styles.inviteButtonText}>Show QR</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {groupRestaurants.length > 0 && (
        <View style={{ marginBottom: SIZES.padding }}>
          <Text style={styles.sectionTitle}>Group's Rated Restaurants</Text>
          <FlatList
            data={groupRestaurants}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ width: 280, marginRight: SIZES.padding }}>
                <RestaurantCard
                  item={item}
                  onPressReview={() =>
                    navigation.navigate('ReviewScreen', { restaurant: item })
                  }
                  isBookmarked={false}
                  onToggleBookmark={() => {}}
                />
              </View>
            )}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={group.members}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memberCard}
            onPress={() => handleMemberPress(item)}
          >
            <Text style={styles.memberText}>
              {/* Safely render the nested username, falling back to ID if missing */}
              {item.profiles?.username || item.user_id} - {item.role} (
              {item.weight})
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      {isOwner && (
        <View style={styles.ownerControls}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateTempInvite}
          >
            <Text style={styles.generateButtonText}>
              Generate Temporary Invite
            </Text>
          </TouchableOpacity>
          {tempCode && (
            <Text style={styles.tempCodeText}>Temp Code: {tempCode}</Text>
          )}

          {activeInvites.length > 0 && (
            <View style={styles.invitesContainer}>
              <Text style={styles.invitesTitle}>Active Temporary Invites</Text>
              <ScrollView
                style={styles.invitesScrollArea}
                nestedScrollEnabled={true}
              >
                {activeInvites.map((inv) => (
                  <View key={inv.id} style={styles.inviteCard}>
                    <Text style={styles.inviteCode}>{inv.code}</Text>
                    <View>
                      <Text style={styles.inviteMeta}>
                        Created by: {inv.profiles?.username || 'Unknown'}
                      </Text>
                      <Text style={styles.inviteMeta}>
                        Expires: {new Date(inv.expires_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteGroup}
          >
            <Text style={styles.deleteButtonText}>Delete Group</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan to Join</Text>
            {group?.permanent_invite_code ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={group.permanent_invite_code}
                  size={200}
                  backgroundColor="#fff"
                  color="#000"
                />
              </View>
            ) : null}
            <Text style={styles.qrCodeText}>
              {group?.permanent_invite_code}
            </Text>
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.qrCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginBottom: SIZES.largeRadius,
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: SIZES.base },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: { fontSize: 16, color: COLORS.textLight },
  copyButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: { fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SIZES.radius,
  },
  listContent: { paddingBottom: SIZES.largeRadius },
  memberCard: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.base,
    marginBottom: SIZES.base,
  },
  memberText: { fontSize: 16 },
  ownerControls: {
    marginTop: SIZES.padding,
    flexShrink: 1,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  generateButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tempCodeText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SIZES.base,
    fontWeight: 'bold',
  },
  invitesContainer: {
    marginTop: SIZES.padding,
    flexShrink: 1,
  },
  invitesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  invitesScrollArea: {
    maxHeight: 180,
  },
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.base,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inviteCode: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  inviteMeta: { fontSize: 14, color: COLORS.textLight, textAlign: 'right' },
  deleteButton: {
    backgroundColor: COLORS.danger,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  deleteButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  inviteActionRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  qrCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginTop: 20,
    color: COLORS.primary,
  },
  qrCloseButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
  },
  qrCloseText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
