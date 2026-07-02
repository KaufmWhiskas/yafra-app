import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlacePredictions } from '../../services/searchService';
import { Prediction } from '../../types';
import { COLORS, SIZES } from '../../constants/theme';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBarProps {
  onPlaceSelect: (place: Prediction) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function SearchBar({
  onPlaceSelect,
  userLocation,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>(
    undefined,
  );
  const insets = useSafeAreaInsets();

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (isFocused) {
      // Small timeout ensures the Modal animation is complete before requesting focus
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!query) {
      setSessionToken(
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
      );
    }
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      if (!sessionToken) return;

      setIsLoading(true);
      try {
        const searchRequest = {
          query: debouncedQuery,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        };
        const results = await getPlacePredictions(searchRequest, sessionToken);
        setPredictions(results);
      } catch (error) {
        console.error('Failed to fetch place predictions:', error);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [debouncedQuery, userLocation, sessionToken]);

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsFocused(false);
    setQuery('');
    setPredictions([]);
    Keyboard.dismiss();
  };

  const handleSelectPrediction = (place: Prediction) => {
    Keyboard.dismiss();
    setIsFocused(false);
    setQuery('');
    setPredictions([]);
    // Pass execution up immediately. Let MapScreen handle the transition delays.
    onPlaceSelect(place);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text === '') {
      setPredictions([]);
      setIsLoading(false);
    }
  };

  const showNoResults =
    !isLoading && debouncedQuery.length >= 3 && predictions.length === 0;

  return (
    <>
      <TouchableOpacity
        style={styles.inputContainer}
        activeOpacity={1}
        onPress={() => setIsFocused(true)}
        testID="search-bar-trigger" // <-- ADD THIS FOR JEST
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={COLORS.textLight}
          style={styles.icon}
        />
        <View style={styles.input} pointerEvents="none">
          <Text
            style={query ? styles.inputText : styles.placeholderText}
            numberOfLines={1}
          >
            {query || 'Search for a place or address'}
          </Text>
        </View>
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            testID="clear-button"
            style={styles.clearButton}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={isFocused}
        onRequestClose={handleCancel}
        animationType="fade"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search for a place or address"
              value={query}
              onChangeText={handleQueryChange}
              placeholderTextColor={COLORS.textLight}
              testID="search-input"
              ref={inputRef}
            />
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fullscreenPredictions}>
            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} size="large" />
            ) : (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.predictionText} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <Text style={styles.distanceText}>
                          {item.distance || 'Unknown'}
                        </Text>
                        {item.rating && (
                          <Text style={styles.ratingText}>
                            {' '}
                            • ⭐ {item.rating}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  showNoResults ? (
                    <View style={styles.predictionItem}>
                      <Text style={styles.noResultsText}>
                        No results found near you
                      </Text>
                    </View>
                  ) : null
                }
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
    zIndex: 999, // Force modal stack to the top
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  icon: { marginRight: SIZES.base },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  inputText: { fontSize: 16, color: COLORS.text },
  placeholderText: { fontSize: 16, color: COLORS.textLight },
  activityIndicator: { marginLeft: SIZES.base },
  clearButton: { marginLeft: SIZES.base, padding: 4 },
  cancelButton: {
    marginLeft: SIZES.base,
    padding: 8,
  },
  cancelButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  fullscreenPredictions: { flex: 1, backgroundColor: COLORS.background },
  predictionItem: {
    padding: SIZES.padding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  predictionText: { fontSize: 16, color: COLORS.text, flexShrink: 1 },
  distanceText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginLeft: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
