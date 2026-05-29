import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Restaurant } from '../../types';
import RestaurantCard from './RestaurantCard';
import { COLORS } from '../../constants/theme';

interface QuickAddModalProps {
  visible: boolean;
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export default function QuickAddModal({
  visible,
  restaurants,
  onSelect,
  onClose,
}: QuickAddModalProps) {
  const [showMore, setShowMore] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible || restaurants.length === 0) return null;

  const closest = restaurants[0];
  const others = restaurants.slice(1, 4);

  const handleClose = () => {
    setShowMore(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {!showMore ? (
            <>
              <Text style={styles.title}>Are you here?</Text>
              <RestaurantCard
                item={closest}
                onPressReview={() => onSelect(closest)}
              />

              {others.length > 0 && (
                <TouchableOpacity
                  style={styles.noButton}
                  onPress={() => setShowMore(true)}
                >
                  <Text style={styles.noButtonText}>
                    No, I'm somewhere else
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.moreContainer}>
              <Text style={styles.subtitle}>Maybe one of these?</Text>
              <FlatList
                data={others}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.otherCardWrapper}>
                    <RestaurantCard
                      item={item}
                      onPressReview={() => onSelect(item)}
                    />
                  </View>
                )}
              />
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: COLORS.text,
  },
  noButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  noButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  moreContainer: {
    marginTop: 16,
    flexShrink: 1, // Prevents the FlatList from pushing the Close button off-screen
  },
  otherCardWrapper: {
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
