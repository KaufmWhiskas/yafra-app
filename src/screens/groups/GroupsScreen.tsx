import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchMyGroups } from '../../services/groupService';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { useActiveGroupFilters } from '../../hooks/useActiveGroupFilters';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeGroupIds, toggleGroupFilter } = useActiveGroupFilters();

  const loadGroups = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await fetchMyGroups(session.user.id);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load user groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  // Split groups into visible vs hidden categories for cleaner organization
  const { activeCircles, inactiveCircles } = useMemo(() => {
    const active: Group[] = [];
    const inactive: Group[] = [];
    groups.forEach((g) => {
      if (activeGroupIds.includes(g.id)) {
        active.push(g);
      } else {
        inactive.push(g);
      }
    });
    return { activeCircles: active, inactiveCircles: inactive };
  }, [groups, activeGroupIds]);

  const listData = useMemo(() => {
    const data: (
      | { type: 'header'; title: string }
      | { type: 'item'; group: Group }
    )[] = [];

    if (activeCircles.length > 0) {
      data.push({
        type: 'header',
        title: `Active Map Feeds (${activeCircles.length})`,
      });
      activeCircles.forEach((g) => data.push({ type: 'item', group: g }));
    }

    if (inactiveCircles.length > 0) {
      data.push({ type: 'header', title: 'Other Circles' });
      inactiveCircles.forEach((g) => data.push({ type: 'item', group: g }));
    }

    return data;
  }, [activeCircles, inactiveCircles]);

  const renderItem = ({ item }: { item: (typeof listData)[0] }) => {
    if (item.type === 'header') {
      return <Text style={styles.sectionHeader}>{item.title}</Text>;
    }

    const { group } = item;
    const isActive = activeGroupIds.includes(group.id);
    const isOwner = session?.user?.id === group.created_by;

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() =>
            navigation.navigate('GroupDetailScreen', { groupId: group.id })
          }
        >
          <View
            style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}
          >
            <MaterialCommunityIcons
              name={isActive ? 'compass' : 'account-group'}
              size={22}
              color={isActive ? COLORS.primary : COLORS.textLight}
            />
          </View>
          <View style={styles.groupMeta}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, isOwner && styles.ownerBadge]}>
                <Text
                  style={[styles.roleText, isOwner && styles.ownerRoleText]}
                >
                  {isOwner ? 'Owner' : 'Member'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.toggleWrapper}>
          <Switch
            value={isActive}
            onValueChange={() => toggleGroupFilter(group.id)}
            trackColor={{ false: '#e2e8f0', true: COLORS.primary + '35' }}
            thumbColor={isActive ? COLORS.primary : '#cbd5e1'}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          testID="activity-indicator"
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Food Circles</Text>
          <Text style={styles.headerSubtitle}>
            Toggle circles to customize map ratings
          </Text>
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `h-${index}` : item.group.id
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={54}
              color={COLORS.textLight}
              style={{ opacity: 0.5 }}
            />
            <Text style={styles.emptyText}>
              Create or join a circle to get started.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  cardActive: {
    borderLeftColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary + '15',
  },
  groupMeta: { flex: 1 },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary + '15',
  },
  roleText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  ownerRoleText: { color: COLORS.primary },
  toggleWrapper: { marginLeft: 12, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 14,
    fontWeight: '500',
  },
});
