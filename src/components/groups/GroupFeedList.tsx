import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { useGroupFeed } from '../../hooks/useGroupFeed';
import FeedCard from './FeedCard';

interface GroupFeedListProps {
  groupId: string;
}

export default function GroupFeedList({ groupId }: GroupFeedListProps) {
  const { reviews, isLoading, error } = useGroupFeed(groupId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No feed activity yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <FeedCard review={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SIZES.largeRadius,
  },
});
