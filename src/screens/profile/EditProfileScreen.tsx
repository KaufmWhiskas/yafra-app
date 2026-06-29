import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { updateProfileName } from '../../services/profileService';
import {
  sendPasswordResetOtp,
  uploadAvatar,
  updateProfileAvatar,
} from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';

export default function EditProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const user = session?.user;

  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleSaveName = async () => {
    if (!user) return;
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a valid name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfileName(user.id, newName.trim());
      Alert.alert('Success', 'Profile name updated successfully.');
      navigation.goBack();
    } catch (err) {
      const error = err as Error;
      Alert.alert('Error', error.message || 'Failed to update profile name.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    // 1. Request media library permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Denied',
        'Permission to access gallery is required to change your avatar.',
      );
      return;
    }

    try {
      // 2. Launch Image Picker with square aspect constraints
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;

      setIsUploadingImage(true);
      const selectedUri = pickerResult.assets[0].uri;

      // 3. Aggressive Downsizing & Quality Compression (Protects Free Storage Bucket Capacity)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        selectedUri,
        [{ resize: { width: 300 } }], // Shrinks dimensions to standard avatar size
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }, // Compress to ~40KB
      );

      // 4. Fire the stream upload using verified session parameters
      const publicUrl = await uploadAvatar(manipulatedImage.uri);

      // 5. Update the profiles data table row relation
      await updateProfileAvatar(publicUrl);

      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (err) {
      const error = err as Error;
      Alert.alert(
        'Upload Failed',
        error.message || 'An error occurred during upload.',
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleComingSoon = () => {
    Alert.alert('Coming Soon', 'This feature is under construction.');
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Your email is not available for password reset.');
      return;
    }

    const userEmail = user.email;

    Alert.alert(
      'Confirm Password Reset',
      `A password reset code will be sent to ${userEmail}. Are you sure you want to continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Code',
          onPress: async () => {
            try {
              await sendPasswordResetOtp(userEmail);
              Alert.alert(
                'Password Reset',
                `A password reset code has been sent to ${userEmail}. Please enter it on the next screen.`,
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      navigation.navigate('ProfileOtpScreen', {
                        email: userEmail,
                      }),
                  },
                ],
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to send reset code: ${message}`);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.label}>New Profile Name</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Enter new name"
          placeholderTextColor={COLORS.textLight}
        />
        <Text
          style={{
            color: COLORS.textLight,
            fontSize: 12,
            marginBottom: 16,
            marginTop: -12,
          }}
        >
          Note: You can only change your profile name once every 7 days.
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.disabledButton]}
          onPress={handleSaveName}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>Save Name</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[
            styles.placeholderButton,
            isUploadingImage && styles.disabledButton,
          ]}
          onPress={handleChangeProfilePicture}
          disabled={isUploadingImage}
        >
          {isUploadingImage ? (
            <ActivityIndicator size="small" color={COLORS.textLight} />
          ) : (
            <Text style={styles.placeholderButtonText}>
              Change Profile Picture
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.placeholderButton, styles.disabledFeature]}
          onPress={handleComingSoon}
        >
          <Text style={styles.placeholderButtonText}>Update Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.placeholderButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.placeholderButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 20,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 30 },
  placeholderButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  placeholderButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  disabledFeature: {
    opacity: 0.4,
  },
});
