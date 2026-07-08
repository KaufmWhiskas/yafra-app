import React, { useState, useMemo } from 'react';
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
import { TAG_CATEGORIES } from '../../constants/tags';

interface TagSelectorProps {
  tags: string[]; // Master list of loaded available tags
  selected: string[]; // Currently active tags inside the review state
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

  // Dynamic Bubble Lift: Sort selected tags to the absolute front of the array
  const categorizedTags = useMemo(() => {
    const processList = (availableItems: string[]) => {
      return [...availableItems].sort((a, b) => {
        const aSelected = selected.includes(a) ? 1 : 0;
        const bSelected = selected.includes(b) ? 1 : 0;
        return bSelected - aSelected; // Bubbles active items to the front
      });
    };

    // Filter master list values into structured UI subgroups
    const customItems = tags.filter(
      (t) =>
        !TAG_CATEGORIES.DIETARY.includes(t) &&
        !TAG_CATEGORIES.ATMOSPHERE.includes(t) &&
        !TAG_CATEGORIES.FOOD_SERVICE.includes(t),
    );

    return {
      ACTIVE_CUSTOM: processList(customItems),
      DIETARY: processList(
        tags.filter((t) => TAG_CATEGORIES.DIETARY.includes(t)),
      ),
      ATMOSPHERE: processList(
        tags.filter((t) => TAG_CATEGORIES.ATMOSPHERE.includes(t)),
      ),
      SERVICE: processList(
        tags.filter((t) => TAG_CATEGORIES.FOOD_SERVICE.includes(t)),
      ),
    };
  }, [tags, selected]);

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

  const renderTagGroup = (label: string, items: string[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.categoryBlock}>
        <Text style={styles.categoryLabel}>{label}</Text>
        <View style={styles.tagWrapperRow}>
          {items.map((tag) => {
            const isSelected = selected.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  onToggle(tag);
                }}
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
      </View>
    );
  };

  return (
    <View testID={testID}>
      {renderTagGroup('Your Custom Tags', categorizedTags.ACTIVE_CUSTOM)}
      {renderTagGroup('Dietary Options', categorizedTags.DIETARY)}
      {renderTagGroup('Atmosphere & Vibe', categorizedTags.ATMOSPHERE)}
      {renderTagGroup('Food & Service', categorizedTags.SERVICE)}

      <TouchableOpacity
        style={styles.addButtonRow}
        onPress={toggleAdd}
        testID="add-custom-tag-button"
      >
        <MaterialCommunityIcons
          name={isAdding ? 'close' : 'plus'}
          size={16}
          color={isAdding ? COLORS.textLight : COLORS.primary}
        />
        <Text
          style={[
            styles.addButtonLabel,
            isAdding && styles.addButtonLabelCancel,
          ]}
        >
          {isAdding ? 'Cancel Custom Tag' : 'Add Custom Highlight Tag...'}
        </Text>
      </TouchableOpacity>

      {isAdding && (
        <View style={styles.customTagContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. BYOB, Cash Only, Great Cocktails"
            placeholderTextColor={COLORS.textLight}
            value={customTag}
            onChangeText={setCustomTag}
            onSubmitEditing={handleAdd}
            maxLength={25}
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
  categoryBlock: {
    marginBottom: 14,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagWrapperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: COLORS.surface,
  },
  addButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
    marginBottom: SIZES.padding,
  },
  addButtonLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonLabelCancel: {
    color: COLORS.textLight,
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
    marginBottom: SIZES.padding,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#eee',
  },
  submitCustomButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  submitCustomButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});
