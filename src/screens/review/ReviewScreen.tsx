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
import { submitReview } from '../../services/reviewService';

/**
 * Screen allowing users to submit a rating and text review for a restaurant.
 */
export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewScreen'>>();
  const navigation = useNavigation();
  const { restaurant } = route.params;

  const [rating, setRating] = useState('');
  const [priceValueRating, setPriceValueRating] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');

  const formatRatingInput = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');

    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    if (cleaned.includes('.')) {
      const [whole, decimal] = cleaned.split('.');
      cleaned = `${whole}.${decimal.slice(0, 1)}`;
    }

    if (parseFloat(cleaned) > 5) {
      return '5.0';
    }

    return cleaned;
  };

  /**
   * Validates inputs and "submits" the review before navigating back.
   */
  const handleSubmitReview = async () => {
    const parsedRating = parseFloat(rating);
    const parsedPriceValue = parseFloat(priceValueRating);

    if (
      isNaN(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5 ||
      isNaN(parsedPriceValue) ||
      parsedPriceValue < 1 ||
      parsedPriceValue > 5
    ) {
      setError(
        'Ratings must be between 1.0 and 5.0 with up to one decimal place.',
      );
      return;
    }

    setError('');

    try {
      await submitReview({
        restaurantId: restaurant.id.toString(),
        rating: parsedRating,
        priceValueRating: parsedPriceValue,
        reviewText,
      });

      navigation.goBack();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review for {restaurant.name}</Text>

      <Text style={styles.label}>Overall Rating</Text>
      <TextInput
        style={styles.input}
        placeholder="Rating (1.0 - 5.0)"
        keyboardType="numeric"
        value={rating}
        onChangeText={(text) => setRating(formatRatingInput(text))}
      />

      <Text style={styles.label}>Price/Value</Text>
      <TextInput
        style={styles.input}
        placeholder="Price/Value (1.0 - 5.0)"
        keyboardType="numeric"
        value={priceValueRating}
        onChangeText={(text) => setPriceValueRating(formatRatingInput(text))}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write your review here..."
        value={reviewText}
        onChangeText={setReviewText}
        multiline
        numberOfLines={4}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  label: {
    marginRight: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  starSelected: {
    fontSize: 30,
    color: '#FFD700',
  },
  starUnselected: {
    fontSize: 30,
    color: '#CCCCCC',
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
