import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  fetchMyGroups,
  createGroup,
  joinGroupWithCode,
} from '../../services/groupService';
import { Group } from '../../types';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const createInputRef = useRef<TextInput>(null);
  const joinInputRef = useRef<TextInput>(null);

  const { session } = useAuth();
  const user = session?.user;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();

  const loadGroups = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchMyGroups(user.id);
      setGroups(data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleCreateGroup = async () => {
    if (!user?.id || !newGroupName.trim()) return;
    try {
      await createGroup(user.id, newGroupName.trim());
      setCreateModalVisible(false);
      setNewGroupName('');
      loadGroups();
    } catch (error) {
      const err = error as Error;
      console.error('Failed to create group', err);
      Alert.alert(
        'Cannot Create Group',
        err.message || 'An unknown error occurred.',
      );
    }
  };

  const handleJoinGroup = async (scannedCode?: string) => {
    const code = typeof scannedCode === 'string' ? scannedCode : inviteCode;
    if (!user?.id || !code.trim()) return;
    try {
      await joinGroupWithCode(user.id, code.trim());
      setJoinModalVisible(false);
      setInviteCode('');
      loadGroups();
    } catch (error) {
      const err = error as Error;
      console.error('Failed to join group', err);
      Alert.alert(
        'Cannot Join Group',
        err.message || 'An unknown error occurred.',
      );
    }
  };

  const handleCancelCreate = () => {
    setCreateModalVisible(false);
    setNewGroupName('');
  };

  const handleCancelJoin = () => {
    setJoinModalVisible(false);
    setInviteCode('');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanning) return;
    setIsScanning(true);
    setScannerVisible(false);

    setInviteCode(data);
    handleJoinGroup(data);

    setTimeout(() => setIsScanning(false), 2000);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'We need camera access to scan QR codes.',
        );
        return;
      }
    }
    setScannerVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading groups...</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() =>
                navigation.navigate('GroupDetailScreen', { groupId: item.id })
              }
            >
              <Text style={styles.groupName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>You are not in any groups yet.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          testID="create-group-button"
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.joinButton]}
          testID="join-group-button"
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent
        onShow={() => setTimeout(() => createInputRef.current?.focus(), 100)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              ref={createInputRef}
              placeholder="Group Name"
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
              returnKeyType="done"
              onSubmitEditing={handleCreateGroup}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={handleCancelCreate}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGroup}>
                <Text style={styles.submitText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="fade"
        transparent
        onShow={() => setTimeout(() => joinInputRef.current?.focus(), 100)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <View style={styles.joinRow}>
              <TextInput
                ref={joinInputRef}
                placeholder="Invite Code"
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={inviteCode}
                onChangeText={setInviteCode}
                returnKeyType="done"
                onSubmitEditing={() => handleJoinGroup()}
              />
              <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={handleCancelJoin}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleJoinGroup()}>
                <Text style={styles.submitText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={isScanning ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>
              Point your camera at a Group QR Code
            </Text>
            <View style={styles.scannerTarget} />
          </View>
          <TouchableOpacity
            style={styles.scannerCloseBtn}
            onPress={() => setScannerVisible(false)}
          >
            <Text style={styles.scannerCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  listContent: { paddingBottom: 80 },
  loadingText: { textAlign: 'center', marginTop: 20 },
  groupCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.base,
    marginBottom: SIZES.radius,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: COLORS.textLight,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: SIZES.base,
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  joinButton: {
    marginRight: 0,
    marginLeft: SIZES.base,
    backgroundColor: COLORS.text,
  },
  buttonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: SIZES.radius,
    width: '80%',
    marginBottom: Platform.OS === 'android' ? 100 : 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: SIZES.padding },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: SIZES.base,
    padding: 12,
    marginBottom: SIZES.padding,
    color: COLORS.text,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: 16,
    marginRight: 20,
  },
  submitText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SIZES.padding,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderColor: COLORS.primary,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  scannerCloseBtn: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  scannerCloseText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
