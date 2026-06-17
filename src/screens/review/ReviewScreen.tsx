import { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, SIZES } from '../../constants/theme';
import { submitReview } from '../../services/reviewService';
import ScoreSelector from '../../components/review/ScoreSelector';
import EatInToggle from '../../components/review/EatInToggle';
import TagSelector from '../../components/review/TagSelector';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Screen allowing users to submit a rating and text review for a restaurant.
 */
export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewScreen'>>();
  const navigation = useNavigation();
  const { restaurant } = route.params;

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [rating, setRating] = useState<number>(3.0);
  const [priceScore, setPriceScore] = useState<number>(3.0);
  const [isEatIn, setIsEatIn] = useState<boolean>(true);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  const [availableTags, setAvailableTags] = useState<string[]>([
    'Great Value',
    'Overpriced',
    'Hidden Gem',
    'Crowded',
    'Fast Service',
    'Slow Service',
    'Vegan Options',
    'Gluten-Free',
    'Spicy',
    'Comfort Food',
    'Date Night',
    'Family Friendly',
    'Loud',
    'Cozy',
    'Outdoor Seating',
    'Pet Friendly',
  ]);
  const [error, setError] = useState('');

  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 6);

  const handleSubmitReview = async () => {
    if (
      rating < 1.0 ||
      rating > 5.0 ||
      (isAdvanced && (priceScore < 1.0 || priceScore > 5.0))
    ) {
      setError('Rating must be between 1.0 and 5.0.');
      return;
    }

    setError('');
    try {
      const result = await submitReview({
        restaurantId: restaurant.id.toString(),
        rating,
        priceScore: isAdvanced ? priceScore : 0,
        isEatIn: isAdvanced ? isEatIn : true,
        tags: isAdvanced ? selectedTags : [],
        description: isAdvanced ? description : '',
      });

      if (result.success) {
        Alert.alert('Success', 'Your review has been submitted!');
        navigation.goBack();
      }
    } catch (err) {
      const error = err as { code?: string; message?: string };

      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique constraint')
      ) {
        setError(
          'You have already reviewed this restaurant today. You can add another entry tomorrow.',
        );
      } else {
        setError(
          'Could not save your review right now. Please check your connection and try again.',
        );
      }
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = (tag: string) => {
    if (!availableTags.includes(tag))
      setAvailableTags((prev) => [tag, ...prev]);
    if (!selectedTags.includes(tag)) setSelectedTags((prev) => [...prev, tag]);
    setShowAllTags(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Review for {restaurant.name}</Text>

        <ScoreSelector
          value={rating}
          onChange={setRating}
          label="Overall Score"
        />

        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setIsAdvanced(!isAdvanced)}
        >
          <Text style={styles.advancedToggleText}>
            {isAdvanced
              ? 'Show Simple Review'
              : 'Add Advanced Details (Optional)'}
          </Text>
          <MaterialCommunityIcons
            name={isAdvanced ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {isAdvanced && (
          <View style={styles.advancedSection}>
            <View style={styles.divider} />

            <ScoreSelector
              value={priceScore}
              onChange={setPriceScore}
              label="Price / Value"
            />

            <Text style={styles.sectionTitle}>Experience Type</Text>
            <EatInToggle isEatIn={isEatIn} onChange={setIsEatIn} />

            <View style={styles.tagsHeader}>
              <Text style={styles.sectionTitle}>Tags & Highlights</Text>
              {!showAllTags && (
                <TouchableOpacity onPress={() => setShowAllTags(true)}>
                  <Text style={styles.showMoreText}>Show All...</Text>
                </TouchableOpacity>
              )}
            </View>

            <TagSelector
              tags={displayedTags}
              selected={selectedTags}
              onToggle={handleToggleTag}
              onAddCustom={handleAddCustomTag}
            />

            <Text style={styles.sectionTitle}>Detailed Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What did you love or hate?"
              placeholderTextColor={COLORS.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitReview}
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    color: COLORS.text,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    marginTop: SIZES.base,
  },
  advancedToggleText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 4,
  },
  advancedSection: { marginTop: SIZES.base },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: SIZES.padding },
  sectionTitle: {
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SIZES.padding,
  },
  showMoreText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SIZES.base,
  },
  errorText: {
    color: COLORS.danger,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  submitButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
