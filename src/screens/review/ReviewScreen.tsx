import { useState, useEffect, useReducer, useRef } from 'react';
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
  Switch,
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

interface ReviewState {
  rating: number;
  priceScore: number;
  experienceType: ExperienceType;
  description: string;
  visitDate: Date | null;
  isPrivate: boolean;
  selectedTags: string[];
  isAdvanced: boolean;
}

type ReviewAction =
  | {
      type: 'SET_FIELD';
      field: keyof ReviewState;
      value: ReviewState[keyof ReviewState];
    }
  | { type: 'TOGGLE_TAG'; tag: string }
  | { type: 'ADD_CUSTOM_TAG'; tag: string }
  | { type: 'TOGGLE_ADVANCED' };

function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_TAG':
      return {
        ...state,
        selectedTags: state.selectedTags.includes(action.tag)
          ? state.selectedTags.filter((t) => t !== action.tag)
          : [...state.selectedTags, action.tag],
      };
    case 'ADD_CUSTOM_TAG':
      return {
        ...state,
        selectedTags: [...new Set([...state.selectedTags, action.tag])],
      };
    case 'TOGGLE_ADVANCED':
      return { ...state, isAdvanced: !state.isAdvanced };
    default:
      return state;
  }
}
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

  const initialState: ReviewState = {
    rating: (existingReviewData?.rating as number | undefined) || 3.0,
    priceScore:
      (existingReviewData?.price_value_rating as number | undefined) || 3.0,
    experienceType:
      (metadata?.experience_type as ExperienceType | undefined) || 'eat-in',
    description: (existingReviewData?.review_text as string | undefined) || '',
    isPrivate: (existingReviewData?.is_private as boolean | undefined) || false,
    selectedTags: initialTags,
    isAdvanced: initialAdvanced,
    visitDate: (() => {
      if (isEditing) {
        return existingReviewData?.visit_date
          ? new Date(existingReviewData.visit_date as string)
          : null;
      }
      return new Date();
    })(),
  };

  const [state, dispatch] = useReducer(reviewReducer, initialState);
  const {
    rating,
    priceScore,
    experienceType,
    description,
    visitDate,
    isPrivate,
    selectedTags,
    isAdvanced,
  } = state;

  const scrollViewRef = useRef<ScrollView>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 6);

  useEffect(() => {
    if (isEditing) {
      setShowAllTags(true);
    }
  }, [isEditing]);

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
        isPrivate: isAdvanced ? isPrivate : false,
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
    dispatch({ type: 'TOGGLE_TAG', tag });
  };

  const handleAddCustomTag = (tag: string) => {
    if (tag.length > 25) {
      Alert.alert('Tag Too Long', 'Custom tags cannot be more than 25 characters.');
      return;
    }
    if (!availableTags.includes(tag)) {
      setAvailableTags((prev) => [tag, ...prev]);
    }
    if (!state.selectedTags.includes(tag)) {
      dispatch({ type: 'ADD_CUSTOM_TAG', tag });
    }
    if (!showAllTags) setShowAllTags(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 80} // Reverted to original offset
      testID="review-screen-kav"
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Review for {restaurant.name}</Text>

        <ScoreSelector
          value={rating}
          onChange={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'rating', value })
          }
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
              dispatch({ type: 'SET_FIELD', field: 'visitDate', value: null });
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
                dispatch({
                  type: 'SET_FIELD',
                  field: 'visitDate',
                  value: selectedDate,
                });
              }
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Experience Type</Text>
        <ExperienceToggle
          value={experienceType}
          onChange={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'experienceType', value })
          }
        />

        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => dispatch({ type: 'TOGGLE_ADVANCED' })}
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
              onChange={(value) =>
                dispatch({ type: 'SET_FIELD', field: 'priceScore', value })
              }
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
              testID="tag-selector"
            />

            <View style={styles.privacyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Group Only (Private)</Text>
                <Text style={styles.privacyDescription}>
                  Hide this review from the public. Only people in your groups
                  will see it.
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={(value) =>
                  dispatch({ type: 'SET_FIELD', field: 'isPrivate', value })
                }
                trackColor={{ false: '#ccc', true: COLORS.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <Text style={styles.sectionTitle}>Detailed Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What did you love or hate?"
              placeholderTextColor={COLORS.textLight}
              value={description}
              onChangeText={(value) =>
                dispatch({ type: 'SET_FIELD', field: 'description', value })
              }
              multiline
              numberOfLines={4}
              maxLength={500} // FIX: Restrict string payloads to a safe 500 characters
              onFocus={() => {
                // A slight delay ensures the keyboard is fully visible before scrolling
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
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
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: '#eee',
  },
  privacyDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    paddingRight: 16,
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
