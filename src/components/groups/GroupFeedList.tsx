import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SIZES } from '../../constants/theme';
import { useGroupFeed } from '../../hooks/useGroupFeed';
import FeedCard from './FeedCard';
import { RootStackParamList } from '../../types/navigation';

interface GroupFeedListProps {
  groupId: string;
}

export default function GroupFeedList({ groupId }: GroupFeedListProps) {
  const { reviews, isLoading, error } = useGroupFeed(groupId);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (item.restaurant?.google_place_id) {
              navigation.navigate('RestaurantDetail', {
                restaurantId: item.restaurant.google_place_id,
                restaurantName: item.restaurant.name || 'Restaurant Details',
              });
            }
          }}
        >
          <FeedCard review={item} />
        </TouchableOpacity>
      )}
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
