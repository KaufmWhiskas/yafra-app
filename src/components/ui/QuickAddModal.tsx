import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';
import { Restaurant } from '../../types';
import RestaurantCard from './RestaurantCard';
import { COLORS, SIZES } from '../../constants/theme';

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
  const translateY = useRef(new Animated.Value(0)).current;

  // 1. Hoisted handleClose so the panResponder always has access to it
  const handleClose = () => {
    setShowMore(false);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const animateDismiss = () => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 200,
      useNativeDriver: true,
    }).start(() => handleClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      // 1. NEVER steal the initial tap (lets buttons work)
      onStartShouldSetPanResponder: () => false,
      // 2. ONLY steal the gesture if they drag down clearly (prevents horizontal scroll conflicts)
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

  if (!visible || restaurants.length === 0) return null;

  const closest = restaurants[0];
  const others = restaurants.slice(1, 4);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* 2. Absolute Fill Backdrop cleanly catches outside taps without interfering with inner layout */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View
          style={[styles.modalCard, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.swipeHandle} />

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
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    maxHeight: '80%',
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
    marginBottom: SIZES.padding,
    textAlign: 'center',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: SIZES.padding,
    marginBottom: SIZES.radius,
    color: COLORS.text,
  },
  noButton: {
    marginTop: SIZES.padding,
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
    marginBottom: SIZES.radius,
  },
  closeButton: {
    marginTop: SIZES.padding,
    padding: SIZES.padding,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.base,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
