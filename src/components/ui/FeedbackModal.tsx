import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { submitBetaFeedback } from '../../services/profileService';

interface FeedbackModalProps {
  visible: boolean;
  userId?: string;
  onClose: () => void;
}

export default function FeedbackModal({
  visible,
  userId,
  onClose,
}: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // iOS provides smoother animations with 'Will', Android requires 'Did'
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Empty', 'Please enter some feedback before submitting.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to send feedback.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitBetaFeedback(userId, message.trim());
      Alert.alert(
        'Thank You!',
        'Your feedback has been sent directly to the developer.',
      );
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
      Alert.alert('Error', 'Could not send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.content,
            {
              paddingBottom:
                Math.max(insets.bottom, keyboardHeight) +
                (keyboardHeight > 0 ? 60 : 24),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Send Beta Feedback</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Found a bug? Have a feature request? Let us know!
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Type your feedback here..."
            placeholderTextColor={COLORS.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            autoFocus
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Send Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: SIZES.radius,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
