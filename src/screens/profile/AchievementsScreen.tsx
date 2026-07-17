import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAchievementsWithProgress,
  syncHistoricalAchievements,
  AchievementWithProgress,
} from '../../services/achievementService';
import AchievementBadge from '../../components/achievements/AchievementBadge';
import { COLORS, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { hapticNotification } from '../../utils/haptics';

type FilterType = 'ALL' | 'LOCKED' | 'UNLOCKED';
type SortType = 'RARITY' | 'PROGRESS' | 'ALPHABETICAL';

export default function AchievementsScreen() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortType>('RARITY');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAchievementsWithProgress(session.user.id)
        .then(setAchievements)
        .finally(() => setIsLoading(false));
    }
  }, [session?.user?.id]);

  const handleManualSync = async () => {
    if (!session?.user?.id || isSyncing) return;

    setIsSyncing(true);
    try {
      const freshlyUnlocked = await syncHistoricalAchievements(session.user.id);

      // Refresh the list immediately to show new completions
      const updatedList = await fetchAchievementsWithProgress(session.user.id);
      setAchievements(updatedList);

      hapticNotification(Haptics.NotificationFeedbackType.Success);

      if (freshlyUnlocked.length > 0) {
        Alert.alert(
          '🏆 Sync Complete!',
          `We scanned your history and unlocked ${freshlyUnlocked.length} new achievement${freshlyUnlocked.length > 1 ? 's' : ''}!\n\nCheck your updated catalog.`,
          [{ text: 'Awesome!', style: 'default' }],
        );
      } else {
        Alert.alert(
          'Up to Date',
          'Your achievement catalog is already completely synchronized with your review history.',
        );
      }
    } catch (err) {
      console.error('Failed to manually sync achievements:', err);
      Alert.alert('Sync Failed', 'Could not sync achievements. Please check your network connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const processedList = useMemo(() => {
    let result = [...achievements];

    // 1. Filtering
    if (filter === 'LOCKED') result = result.filter((a) => !a.isUnlocked);
    if (filter === 'UNLOCKED') result = result.filter((a) => a.isUnlocked);

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === 'RARITY')
        return b.globalUnlockPercentage - a.globalUnlockPercentage; // Common first
      if (sortBy === 'ALPHABETICAL') return a.title.localeCompare(b.title);
      if (sortBy === 'PROGRESS') {
        const aRatio = a.currentProgress / (a.target || 1);
        const bRatio = b.currentProgress / (b.target || 1);
        return bRatio - aRatio;
      }
      return 0;
    });

    return result;
  }, [achievements, filter, sortBy]);

  const renderAchievementItem = ({
    item,
  }: {
    item: AchievementWithProgress;
  }) => {
    const isSecretAndLocked = item.is_secret && !item.isUnlocked;
    const progressPercent = Math.min(
      Math.round((item.currentProgress / (item.target || 1)) * 100),
      100,
    );

    return (
      <View style={styles.card}>
        <AchievementBadge achievement={item} isUnlocked={item.isUnlocked} />
        <View style={styles.detailsContainer}>
          <Text style={styles.cardTitle}>
            {isSecretAndLocked ? 'Secret Achievement' : item.title}
          </Text>
          <Text style={styles.cardDescription}>
            {isSecretAndLocked
              ? item.secret_description ||
                'Keep exploring to discover this unlock.'
              : item.description}
          </Text>

          {!isSecretAndLocked && item.target > 1 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {item.currentProgress} / {item.target} ({progressPercent}%)
              </Text>
            </View>
          )}
          <Text style={styles.rarityLabel}>
            Rarity: {item.globalUnlockPercentage}% of users unlocked
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtering Header Rows */}
      <View style={styles.filterBar}>
        {(['ALL', 'UNLOCKED', 'LOCKED'] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, filter === type && styles.activeChip]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.chipText,
                filter === type && styles.activeChipText,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortBar}>
        <MaterialCommunityIcons
          name="sort"
          size={18}
          color={COLORS.textLight}
        />
        {(['RARITY', 'PROGRESS', 'ALPHABETICAL'] as SortType[]).map((type) => (
          <TouchableOpacity key={type} onPress={() => setSortBy(type)}>
            <Text
              style={[
                styles.sortText,
                sortBy === type && styles.activeSortText,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.syncBanner}
        onPress={handleManualSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <MaterialCommunityIcons name="cached" size={18} color={COLORS.primary} />
        )}
        <Text style={styles.syncBannerText}>
          {isSyncing ? 'Scanning Review History...' : 'Check & Sync Missing Progress'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={processedList}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: {
    flexDirection: 'row',
    padding: SIZES.base,
    backgroundColor: COLORS.surface,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  activeChip: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  activeChipText: { color: '#fff' },
  sortText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  activeSortText: { color: COLORS.primary, fontWeight: '700' },
  listContainer: { padding: SIZES.padding },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10', // Subtle tint
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  syncBannerText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsContainer: { flex: 1, marginLeft: SIZES.base },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardDescription: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  progressSection: { marginTop: SIZES.base },
  progressBarBg: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  progressText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'right',
  },
  rarityLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
