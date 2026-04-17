import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * Screen allowing users to submit a rating and text review for a restaurant.
 */
export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewScreen'>>();
  const navigation = useNavigation();
  const { restaurant } = route.params;

  const [rating, setRating] = useState('');
  const [reviewText, setReviewText] = useState('');

  /**
   * Validates inputs and "submits" the review before navigating back.
   */
  const handleSubmitReview = () => {
    const numericRating = Number(rating);

    // Guard: Ensure rating is a valid number between 1 and 5
    if (
      !rating ||
      isNaN(Number(rating)) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return;
    }

    // TODO: This will call the Supabase backend
    console.log('Submitting review:', {
      rating: Number(rating),
      description: reviewText,
      restaurant_id: restaurant.id,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review for {restaurant.name}</Text>

      <TextInput
        style={styles.input}
        placeholder="Rating (1-5)"
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
        maxLength={1}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write your review here..."
        value={reviewText}
        onChangeText={setReviewText}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitReview}
      >
        <Text style={styles.submitButtonText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    color: COLORS.text,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
