import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { sendFriendRequest } from '../../services/friendService';
import { COLORS } from '../../constants/theme';

interface FriendScannerProps {
  onClose: () => void;
}

export default function FriendScanner({ onClose }: FriendScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { session } = useAuth();
  const { friends, pendingIncoming, pendingOutgoing, refetch } = useFriends();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (!data.startsWith('yafra://friend/invite?id=')) {
      Alert.alert('Invalid QR Code', 'This is not a valid YAFRA friend code.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const url = new URL(data);
    const targetUserId = url.searchParams.get('id');

    if (!targetUserId || !session?.user?.id) {
      Alert.alert('Error', 'Invalid friend code.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    if (targetUserId === session.user.id) {
      Alert.alert("You can't add yourself!", '', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    // Check for existing relationships
    const isFriend = friends.some((f) => f.id === targetUserId);
    const isPendingOutgoing = pendingOutgoing.some(
      (r) => r.addressee_id === targetUserId,
    );
    const isPendingIncoming = pendingIncoming.some(
      (r) => r.requester_id === targetUserId,
    );

    if (isFriend) {
      Alert.alert(
        'Already Friends',
        'You are already friends with this user.',
        [{ text: 'OK', onPress: onClose }],
      );
      return;
    }
    if (isPendingOutgoing) {
      Alert.alert(
        'Request Sent',
        'You have already sent a friend request to this user.',
        [{ text: 'OK', onPress: onClose }],
      );
      return;
    }
    if (isPendingIncoming) {
      Alert.alert(
        'Request Received',
        'This user has already sent you a friend request. Check your requests to accept it.',
        [{ text: 'OK', onPress: onClose }],
      );
      return;
    }

    Alert.alert(
      'Send Friend Request?',
      'Do you want to send a friend request to this user?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendFriendRequest(session.user.id, targetUserId);
              refetch();
              Alert.alert('Success', 'Friend request sent!', [
                { text: 'OK', onPress: onClose },
              ]);
            } catch (error) {
              console.error('Failed to send friend request:', error);
              Alert.alert('Error', 'Could not send friend request.', [
                { text: 'OK', onPress: () => setScanned(false) },
              ]);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>
      <Button title="Cancel" onPress={onClose} color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    marginBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
  },
});
