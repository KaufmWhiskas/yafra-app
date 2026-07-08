import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

import {
  fetchMyGroups,
  createGroup,
  joinGroupWithCode,
} from '../../services/groupService';
import { Avatar } from '../../components/Avatar';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { useActiveGroupFilters } from '../../hooks/useActiveGroupFilters';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const user = session?.user;

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeGroupIds, toggleGroupFilter } = useActiveGroupFilters();

  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [isJoinVisible, setIsJoinVisible] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningQr, setIsScanningQr] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchMyGroups(user.id);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load user groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  const handleCreateGroup = async () => {
    if (!user?.id || !groupNameInput.trim()) return;
    setIsSubmitting(true);
    try {
      await createGroup(user.id, groupNameInput.trim());
      Alert.alert('Circle Created', 'Your new food circle is ready!');
      setGroupNameInput('');
      setIsCreateVisible(false);
      loadGroups();
    } catch (error) {
      Alert.alert(
        'Creation Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (targetCode?: string) => {
    const codeToSubmit = targetCode || joinCodeInput;
    if (!user?.id || !codeToSubmit.trim()) return;

    setIsSubmitting(true);
    try {
      await joinGroupWithCode(user.id, codeToSubmit.trim().toUpperCase());
      Alert.alert('Joined Successfully', 'Welcome to the circle!');
      setJoinCodeInput('');
      setIsJoinVisible(false);
      loadGroups();
    } catch (error) {
      Alert.alert(
        'Join Failed',
        error instanceof Error ? error.message : 'Invalid code',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to scan circle QR codes.',
        );
        return;
      }
    }
    setIsScanningQr(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setIsScanningQr(false);
    if (data) {
      setJoinCodeInput(data);
      handleJoinGroup(data);
    }
  };

  const { activeCircles, inactiveCircles } = useMemo(() => {
    const active: Group[] = [];
    const inactive: Group[] = [];
    groups.forEach((g) => {
      if (activeGroupIds.includes(g.id)) {
        active.push(g);
      } else {
        inactive.push(g);
      }
    });
    return { activeCircles: active, inactiveCircles: inactive };
  }, [groups, activeGroupIds]);

  const listData = useMemo(() => {
    const data: (
      | { type: 'header'; title: string }
      | { type: 'item'; group: Group }
    )[] = [];

    if (activeCircles.length > 0) {
      data.push({
        type: 'header',
        title: `Active Map Feeds (${activeCircles.length})`,
      });
      activeCircles.forEach((g) => data.push({ type: 'item', group: g }));
    }

    if (inactiveCircles.length > 0) {
      data.push({ type: 'header', title: 'Other Circles' });
      inactiveCircles.forEach((g) => data.push({ type: 'item', group: g }));
    }

    return data;
  }, [activeCircles, inactiveCircles]);

  const renderItem = ({ item }: { item: (typeof listData)[0] }) => {
    if (item.type === 'header') {
      return <Text style={styles.sectionHeader}>{item.title}</Text>;
    }

    const { group } = item;
    const isActive = activeGroupIds.includes(group.id);
    const isOwner = user?.id === group.created_by;

    return (
      <View
        style={[styles.card, isActive && styles.cardActive]}
        testID={`group-card-${group.id}`}
      >
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() =>
            navigation.navigate('GroupDetailScreen', { groupId: group.id })
          }
        >
          <View style={styles.avatarListCardContainer}>
            <Avatar url={group.avatar_url} name={group.name} size={42} />
          </View>

          <View style={styles.groupMeta}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, isOwner && styles.ownerBadge]}>
                <Text
                  style={[styles.roleText, isOwner && styles.ownerRoleText]}
                >
                  {isOwner ? 'Owner' : 'Member'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.toggleWrapper}>
          <Switch
            value={isActive}
            onValueChange={() => toggleGroupFilter(group.id)}
            trackColor={{ false: '#e2e8f0', true: COLORS.primary + '35' }}
            thumbColor={isActive ? COLORS.primary : '#cbd5e1'}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          testID="activity-indicator"
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Food Circles</Text>
            <Text style={styles.headerSubtitle}>
              Toggle circles to customize map ratings
            </Text>
          </View>
          <TouchableOpacity
            style={styles.joinHeaderButton}
            onPress={() => setIsJoinVisible(true)}
          >
            <MaterialCommunityIcons
              name="link-plus"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.joinHeaderButtonText}>Join Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `h-${index}` : item.group.id
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={54}
              color={COLORS.textLight}
              style={{ opacity: 0.5 }}
            />
            <Text style={styles.emptyText}>
              Create or join a circle to get started.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isCreateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create a Food Circle</Text>
            <Text style={styles.modalSubtitle}>
              Give your new circle a fun and descriptive name.
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Berlin Burger Club"
              placeholderTextColor={COLORS.textLight}
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              maxLength={50}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setIsCreateVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleCreateGroup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isJoinVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsJoinVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Food Circle</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit invite code or activate the QR camera scanner
              scanner.
            </Text>

            <View style={styles.inputWrapperRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder="e.g. AB12XY"
                placeholderTextColor={COLORS.textLight}
                value={joinCodeInput}
                onChangeText={setJoinCodeInput}
                autoCapitalize="characters"
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.cameraTriggerButton}
                onPress={handleActivateScanner}
                testID="launch-camera-scanner"
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {isScanningQr && (
              <View style={styles.cameraBoxContainer}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                <TouchableOpacity
                  style={styles.closeCameraOverlayBtn}
                  onPress={() => setIsScanningQr(false)}
                >
                  <Text style={styles.closeCameraText}>Close Scanner</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setIsJoinVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => handleJoinGroup()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  joinHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  joinHeaderButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: { paddingHorizontal: SIZES.padding, paddingBottom: 80 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  cardActive: {
    borderLeftColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary + '15',
  },
  groupMeta: { flex: 1 },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary + '15',
  },
  roleText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  ownerRoleText: { color: COLORS.primary },
  avatarListCardContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleWrapper: { marginLeft: 12, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: SIZES.radius,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  cameraTriggerButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBoxContainer: {
    height: 200,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  closeCameraOverlayBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeCameraText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButtonCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonCancelText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
