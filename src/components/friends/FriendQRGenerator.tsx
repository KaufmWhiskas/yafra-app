import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SIZES } from '../../constants/theme';
import Lucide from '@react-native-vector-icons/lucide';

interface FriendQRGeneratorProps {
  currentUserId: string;
}

export default function FriendQRGenerator({
  currentUserId,
}: FriendQRGeneratorProps) {
  const friendLink = `yafra://friend/invite?id=${currentUserId}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(friendLink);
    Alert.alert('Copied!', 'Friend link copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Friend Code</Text>
      <View style={styles.qrContainer}>
        <QRCode value={friendLink} size={250} />
      </View>
      <Text style={styles.description}>
        Have a friend scan this code to add you on YAFRA.
      </Text>
      <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
        <Lucide name="copy" size={20} color={COLORS.primary} />
        <Text style={styles.copyButtonText}>Copy Link</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    marginBottom: SIZES.padding,
    color: COLORS.text,
  },
  qrContainer: {
    padding: SIZES.padding,
    backgroundColor: 'white',
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  description: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginBottom: SIZES.padding * 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
  },
  copyButtonText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
