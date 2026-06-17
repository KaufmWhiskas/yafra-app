import { useState, useEffect } from 'react';
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
import {
  submitReview,
  updateReview,
  fetchUserTags,
} from '../../services/reviewService';
import ScoreSelector from '../../components/review/ScoreSelector';
import TagSelector from '../../components/review/TagSelector';
import ExperienceToggle, {
  ExperienceType,
} from '../../components/review/ExperienceToggle';
import { DEFAULT_TAGS } from '../../constants/tags';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Screen allowing users to submit a rating and text review for a restaurant.
 */
export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewScreen'>>();
  const navigation = useNavigation();
  const { restaurant, editReviewId, existingReviewData } = route.params;

  const { session } = useAuth();
  const user = session?.user;

  const metadata = existingReviewData?.metadata as
    | Record<string, unknown>
    | undefined;
  const initialTags = (metadata?.tags as string[]) || [];

  const isEditing = !!editReviewId;
  const initialAdvanced = !!(
    isEditing &&
    (existingReviewData?.price_value_rating ||
      existingReviewData?.review_text ||
      initialTags.length > 0)
  );

  const [isAdvanced, setIsAdvanced] = useState(initialAdvanced);
  const [rating, setRating] = useState<number>(
    (existingReviewData?.rating as number | undefined) || 3.0,
  );
  const [priceScore, setPriceScore] = useState<number>(
    (existingReviewData?.price_value_rating as number | undefined) || 3.0,
  );
  const [experienceType, setExperienceType] = useState<ExperienceType>(
    (metadata?.experience_type as ExperienceType | undefined) || 'eat-in',
  );
  const [description, setDescription] = useState<string>(
    (existingReviewData?.review_text as string | undefined) || '',
  );
  const [visitDate, setVisitDate] = useState<Date | null>(() => {
    if (isEditing) {
      return existingReviewData?.visit_date
        ? new Date(existingReviewData.visit_date as string)
        : null; // Keep it clear if it was clear before
    }
    return new Date(); // Only default to today for brand new reviews
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [showAllTags, setShowAllTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 6);

  useEffect(() => {
    if (user?.id) {
      fetchUserTags(user.id).then((userTags) => {
        const merged = [...new Set([...userTags, ...DEFAULT_TAGS])];
        setAvailableTags(merged);
      });
    } else {
      setAvailableTags(DEFAULT_TAGS);
    }
  }, [user?.id]);

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

    const finalVisitDate = visitDate
      ? visitDate.toISOString().split('T')[0]
      : null;

    try {
      const payload = {
        restaurantId: restaurant.id.toString(),
        rating,
        priceScore: isAdvanced ? priceScore : 0,
        experienceType,
        tags: isAdvanced ? selectedTags : [],
        description: isAdvanced ? description : '',
        visitDate: finalVisitDate,
      };

      let result;
      if (isEditing && editReviewId) {
        result = await updateReview(editReviewId, payload);
      } else {
        result = await submitReview(payload);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          `Your review has been ${isEditing ? 'updated' : 'submitted'}!`,
        );
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

        <Text style={styles.sectionTitle}>When did you visit?</Text>
        <View style={styles.dateSelectorRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.dateButtonText}>
              {visitDate
                ? visitDate.toISOString().split('T')[0]
                : 'Unknown Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unknownButton}
            onPress={() => {
              setVisitDate(null);
              setShowDatePicker(false);
            }}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={20}
              color={COLORS.textLight}
            />
            <Text style={styles.unknownButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={visitDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (event.type === 'set' && selectedDate) {
                setVisitDate(selectedDate);
              }
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Experience Type</Text>
        <ExperienceToggle value={experienceType} onChange={setExperienceType} />

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
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Save Changes' : 'Submit Review'}
          </Text>
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
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    flex: 1,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  unknownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    gap: 6,
  },
  unknownButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
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
