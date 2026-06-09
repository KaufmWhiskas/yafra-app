import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
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
} from '../../services/groupService';
import { Group, GroupMember, GroupInvite } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';

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

  const insets = useSafeAreaInsets();

  const loadGroupDetails = useCallback(async () => {
    try {
      const data = await fetchGroupDetails(groupId);
      setGroup(data);
      if (user?.id === data.created_by) {
        const invites = await fetchActiveInvites(groupId);
        setActiveInvites(invites);
      }
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
      </View>

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
});
