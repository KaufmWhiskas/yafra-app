import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyGroups,
  createGroup,
  joinGroupWithCode,
} from '../../services/groupService';
import { Group } from '../../types';
import { COLORS } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { session } = useAuth();
  const user = session?.user;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      loadGroups(); // Refresh the list
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!user?.id || !inviteCode.trim()) return;
    try {
      await joinGroupWithCode(user.id, inviteCode.trim());
      setJoinModalVisible(false);
      setInviteCode('');
      loadGroups();
    } catch (error) {
      console.error('Failed to join group', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  return (
    <View style={styles.container}>
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
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              placeholder="Group Name"
              style={styles.input}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGroup}>
                <Text style={styles.submitText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={joinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <TextInput
              placeholder="Invite Code"
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoinGroup}>
                <Text style={styles.submitText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  listContent: { paddingBottom: 80 },
  loadingText: { textAlign: 'center', marginTop: 20 },
  groupCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  joinButton: { marginRight: 0, marginLeft: 8, backgroundColor: '#333' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#000',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    marginRight: 16,
  },
  submitText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
