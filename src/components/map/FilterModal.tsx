import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { FilterGroup } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { fetchMyGroups } from '../../services/groupService';
import { Group } from '../../types';

const FILTER_GROUPS: FilterGroup[] = [
  'Fast Food',
  'Pizza & Italian',
  'Asian',
  'European',
  'Americas',
  'Middle Eastern & African',
  'Breakfast & Cafe',
  'Bars & Pubs',
  'Snacks & Sweets',
  'Specialty & Dietary',
];

export interface Filters {
  cuisine: string | null;
  minRating: number | null;
  onlyBookmarks: boolean;
  inAppReviewsOnly: boolean;
  targetGroupId: string | null;
}

interface FilterModalProps {
  visible: boolean;
  initialFilters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

export default function FilterModal({
  visible,
  initialFilters,
  onApply,
  onClose,
}: FilterModalProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      translateY.setValue(0);

      if (session?.user?.id) {
        fetchMyGroups(session.user.id)
          .then((data) => setGroups(data))
          .catch((err) =>
            console.error('Failed to load groups for filter', err),
          );
      }
    }
  }, [visible, initialFilters, session?.user?.id, translateY]);

  const animateDismiss = () => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 15 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          animateDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.modalCard, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.swipeHandle} />
          <Text style={styles.title}>Filters</Text>

          <Text style={styles.sectionTitle}>Cuisine</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            <TouchableOpacity
              style={[styles.chip, !filters.cuisine && styles.chipActive]}
              onPress={() => setFilters({ ...filters, cuisine: null })}
            >
              <Text
                style={[
                  styles.chipText,
                  !filters.cuisine && styles.chipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {FILTER_GROUPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  filters.cuisine === c && styles.chipActive,
                ]}
                onPress={() => setFilters({ ...filters, cuisine: c })}
              >
                <Text
                  style={[
                    styles.chipText,
                    filters.cuisine === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            {[null, 3, 4, 4.5, 4.8].map((rating) => (
              <TouchableOpacity
                key={rating ?? 'Any'}
                style={[
                  styles.chip,
                  filters.minRating === rating && styles.chipActive,
                ]}
                onPress={() => setFilters({ ...filters, minRating: rating })}
              >
                <Text
                  style={[
                    styles.chipText,
                    filters.minRating === rating && styles.chipTextActive,
                  ]}
                >
                  {rating ? `${rating}+` : 'Any'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Filter by Group Activity</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                !filters.targetGroupId && styles.chipActive,
              ]}
              onPress={() => setFilters({ ...filters, targetGroupId: null })}
            >
              <Text
                style={[
                  styles.chipText,
                  !filters.targetGroupId && styles.chipTextActive,
                ]}
              >
                None
              </Text>
            </TouchableOpacity>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.chip,
                  filters.targetGroupId === g.id && styles.chipActive,
                ]}
                onPress={() =>
                  setFilters({ ...filters, targetGroupId: g.id })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    filters.targetGroupId === g.id && styles.chipTextActive,
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>Show Bookmarks Only</Text>
            <Switch
              value={filters.onlyBookmarks}
              onValueChange={(val) =>
                setFilters({ ...filters, onlyBookmarks: val })
              }
              trackColor={{ false: '#ccc', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>In-App Reviews Only</Text>
            <Switch
              value={filters.inAppReviewsOnly}
              onValueChange={(val) =>
                setFilters({ ...filters, inAppReviewsOnly: val })
              }
              trackColor={{ false: '#ccc', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: SIZES.largeRadius,
    borderTopRightRadius: SIZES.largeRadius,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    minHeight: 350,
  },
  swipeHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base,
    marginTop: SIZES.base,
  },
  chipRow: {
    maxHeight: 50,
    marginBottom: SIZES.padding,
  },
  chipRowContent: {
    paddingRight: SIZES.padding,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.surface,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
