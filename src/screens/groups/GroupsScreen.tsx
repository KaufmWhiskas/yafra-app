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
    } catch (error: any) {
      console.error('Failed to create group', error);
      Alert.alert(
        'Cannot Create Group',
        error.message || 'An unknown error occurred.',
      );
    }
  };

  const handleJoinGroup = async () => {
    if (!user?.id || !inviteCode.trim()) return;
    try {
      await joinGroupWithCode(user.id, inviteCode.trim());
      setJoinModalVisible(false);
      setInviteCode('');
      loadGroups();
    } catch (error: any) {
      console.error('Failed to join group', error);
      Alert.alert(
        'Cannot Join Group',
        error.message || 'An unknown error occurred.',
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
            <TextInput
              ref={joinInputRef}
              placeholder="Invite Code"
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              returnKeyType="done"
              onSubmitEditing={handleJoinGroup}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={handleCancelJoin}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoinGroup}>
                <Text style={styles.submitText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
});
