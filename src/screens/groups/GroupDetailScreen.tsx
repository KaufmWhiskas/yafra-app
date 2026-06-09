import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import {
  fetchGroupDetails,
  createOneTimeInvite,
} from '../../services/groupService';
import { Group, GroupMember } from '../../types';
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
  const { groupId } = route.params;

  const { session } = useAuth();
  const user = session?.user;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempCode, setTempCode] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  const loadGroupDetails = useCallback(async () => {
    try {
      const data = await fetchGroupDetails(groupId);
      setGroup(data);
    } catch (error) {
      console.error('Failed to load group details', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

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
    } catch (error) {
      console.error('Failed to generate temp invite', error);
    }
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
            Code: {group.permanent_invite_code}
          </Text>
          <TouchableOpacity style={styles.copyButton}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={group.members}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <Text style={styles.memberText}>
              {/* Safely render the nested username, falling back to ID if missing */}
              {item.profiles?.username || item.user_id} - {item.role} (
              {item.weight})
            </Text>
          </View>
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
          <TouchableOpacity style={styles.deleteButton}>
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
  deleteButton: {
    backgroundColor: COLORS.danger,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  deleteButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
});
