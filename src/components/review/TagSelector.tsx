import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TagSelectorProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onAddCustom: (tag: string) => void;
}

export default function TagSelector({
  tags,
  selected,
  onToggle,
  onAddCustom,
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');

  const handleAdd = () => {
    if (customTag.trim()) {
      onAddCustom(customTag.trim());
      setCustomTag('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tagContainer}>
        {tags.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, isSelected && styles.tagSelected]}
              onPress={() => onToggle(tag)}
            >
              <Text
                style={[styles.tagText, isSelected && styles.tagTextSelected]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.customContainer}>
        <TextInput
          style={styles.input}
          value={customTag}
          onChangeText={setCustomTag}
          placeholder="Add custom tag..."
          placeholderTextColor={COLORS.textLight}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={COLORS.surface}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: SIZES.base },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.base,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  tagTextSelected: { color: COLORS.surface, fontWeight: 'bold' },
  customContainer: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    color: COLORS.text,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
