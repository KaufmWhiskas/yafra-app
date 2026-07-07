import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TagSelectorProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onAddCustom: (tag: string) => void;
  testID?: string;
}

export default function TagSelector({
  tags,
  selected,
  onToggle,
  onAddCustom,
  testID,
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (customTag.trim()) {
      onAddCustom(customTag.trim());
      setCustomTag('');
      setIsAdding(false);
    }
  };

  const toggleAdd = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdding(!isAdding);
  };

  return (
    <View testID={testID}>
      <View style={styles.tagContainer}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, selected.includes(tag) && styles.tagSelected]}
            onPress={() => onToggle(tag)}
          >
            <Text
              style={[
                styles.tagText,
                selected.includes(tag) && styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={toggleAdd}
          testID="add-custom-tag-button"
        >
          <MaterialCommunityIcons
            name={isAdding ? 'close' : 'plus'}
            size={18}
            color={isAdding ? COLORS.textLight : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.customTagContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a custom tag..."
            placeholderTextColor={COLORS.textLight}
            value={customTag}
            onChangeText={setCustomTag}
            onSubmitEditing={handleAdd}
            autoFocus
          />
          <TouchableOpacity
            style={styles.submitCustomButton}
            onPress={handleAdd}
          >
            <Text style={styles.submitCustomButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.base,
    marginBottom: SIZES.padding,
  },
  tag: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: COLORS.surface,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#eee',
  },
  submitCustomButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  submitCustomButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});
