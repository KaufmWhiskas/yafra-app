import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { getPlacePredictions, Prediction } from '../../services/searchService';
import { COLORS, SIZES } from '../../constants/theme';

interface SearchBarProps {
  onPlaceSelect: (place: Prediction) => void;
}

/**
 * A search input component that provides place suggestions using Google Places Autocomplete.
 * Uses a session token to bundle keystrokes into a single billable event for cost control.
 */
export default function SearchBar({ onPlaceSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const sessionToken = useRef<string>('');

  useEffect(() => {
    // Initialize session token on mount
    sessionToken.current = Math.random().toString(36).substring(2, 15);
  }, []);

  const handleTextChange = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        const results = await getPlacePredictions(text, sessionToken.current);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (item: Prediction) => {
    onPlaceSelect(item);
    setQuery('');
    setSuggestions([]);
    // Reset session token after a successful selection to start a new billable session
    sessionToken.current = Math.random().toString(36).substring(2, 15);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search places..."
        value={query}
        onChangeText={handleTextChange}
        placeholderTextColor={COLORS.textLight}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.itemText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: SIZES.padding,
    right: SIZES.padding,
    zIndex: 100,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    elevation: 5,
    color: COLORS.text,
  },
  list: {
    backgroundColor: COLORS.surface,
    marginTop: 5,
    borderRadius: SIZES.radius,
    maxHeight: 200,
  },
  item: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  itemText: {
    color: COLORS.text,
  },
});
