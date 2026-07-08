import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fetchGroupDetails,
  createOneTimeInvite,
  fetchActiveInvites,
  deleteGroup,
  updateGroupName,
  updatePermanentInvite,
  updateMemberRole,
  removeGroupMember,
  fetchGroupRestaurants,
  uploadGroupAvatar,
} from '../../services/groupService';
import { fetchUserBookmarkedRestaurantIds } from '../../services/bookmarkService';
import {
  Group,
  GroupMember,
  GroupInvite,
  Restaurant,
  GroupFeedReview,
} from '../../types';
import { useGroupFeed } from '../../hooks/useGroupFeed';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import FeedCard from '../../components/groups/FeedCard';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Avatar } from '../../components/Avatar';
import CollectionModal from '../../components/ui/CollectionModal';

type GroupDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupDetailScreen'
>;
type GroupWithMembers = Group & {
  members: (GroupMember & {
    profiles: {
      username: string;
      avatar_url?: string | null;
      avatarUrl?: string | null;
    };
  })[];
};

type GroupFeedReviewWithPlaceId = Omit<GroupFeedReview, 'restaurant'> & {
  restaurant:
    | (NonNullable<GroupFeedReview['restaurant']> & {
        google_place_id?: string;
      })
    | undefined;
};

type ListItem =
  | { type: 'section_title'; title: string }
  | { type: 'restaurants'; data: Restaurant[] }
  | { type: 'loader'; key: string }
  | { type: 'error'; message: string; key: string }
  | { type: 'empty'; message: string; key: string }
  | { type: 'feed_action_button'; key: string }
  | { type: 'feed_item'; review: GroupFeedReviewWithPlaceId }
  | {
      type: 'member_item';
      member: GroupMember & {
        profiles: {
          username: string;
          avatar_url?: string | null;
          avatarUrl?: string | null;
        };
      };
    };

export default function GroupDetailScreen() {
  const route = useRoute<GroupDetailScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groupId } = route.params;

  const { session } = useAuth();
  const user = session?.user;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempCode, setTempCode] = useState<string | null>(null);
  const [activeInvites, setActiveInvites] = useState<GroupInvite[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [groupRestaurants, setGroupRestaurants] = useState<Restaurant[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedRestaurantForBookmark, setSelectedRestaurantForBookmark] =
    useState<string | number | null>(null);

  const {
    reviews: feedReviewsFromHook,
    isLoading: isFeedLoading,
    error: feedError,
  } = useGroupFeed(groupId);

  const feedReviews = useMemo(() => {
    const reviews = feedReviewsFromHook as GroupFeedReviewWithPlaceId[];
    // Sanitize data for components that may not expect `null` restaurant objects.
    return reviews.map((review) => ({
      ...review,
      restaurant: review.restaurant === null ? undefined : review.restaurant,
    }));
  }, [feedReviewsFromHook]);

  const insets = useSafeAreaInsets();
  const [isQrModalVisible, setQrModalVisible] = useState(false);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const [originalGroupName, setOriginalGroupName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleShareCode = async (code: string, isTemporary = false) => {
    if (!code) return;
    try {
      const groupName = group?.name || 'our food circle';
      const message = isTemporary
        ? `Join my group "${groupName}" on YAFRA using this temporary single-use invite code: ${code} (Expires soon!)`
        : `Join my food review group "${groupName}" on YAFRA! Enter invitation code: ${code}`;

      await Share.share({ message });
    } catch (error) {
      console.error('Failed to trigger native share sheet:', error);
    }
  };

  const loadGroupDetails = useCallback(async () => {
    try {
      const data = await fetchGroupDetails(groupId);
      setGroup(data);
      setOriginalGroupName(data.name); // Store original name for potential cancel
      if (user?.id === data.created_by) {
        const invites = await fetchActiveInvites(groupId);
        setActiveInvites(invites);
      }

      const restaurants = await fetchGroupRestaurants(groupId);
      setGroupRestaurants(restaurants);
    } catch (error) {
      console.error('Failed to load group details', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id, setOriginalGroupName]);

  useFocusEffect(
    useCallback(() => {
      loadGroupDetails();
      if (user?.id) {
        fetchUserBookmarkedRestaurantIds(user.id)
          .then(setBookmarkedIds)
          .catch(console.error);
      }
    }, [loadGroupDetails, user?.id]),
  );

  const handleGenerateTempInvite = async () => {
    if (!user?.id) return;
    try {
      const code = await createOneTimeInvite(groupId, user.id);
      setTempCode(code);
      const invites = await fetchActiveInvites(groupId);
      setActiveInvites(invites);
    } catch (error) {
      const err = error as Error;
      console.warn('Operational bound reached: ', err.message);
      Alert.alert(
        'Cannot Generate Invite',
        err.message || 'An unknown error occurred.',
      );
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert('Delete Group', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(groupId);
            navigation.navigate('MainTabs');
          } catch (error) {
            console.error('Failed to delete group', error);
          }
        },
      },
    ]);
  };

  const handleTogglePermanentCode = async () => {
    try {
      if (group?.permanent_invite_code) {
        await updatePermanentInvite(groupId, null);
      } else {
        const newCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        await updatePermanentInvite(groupId, newCode);
      }
      loadGroupDetails();
    } catch (error) {
      console.error('Failed to toggle code', error);
    }
  };

  const handleRestaurantCardPress = (restaurant: Restaurant) => {
    if (restaurant.google_place_id) {
      navigation.navigate('RestaurantDetail', {
        restaurantId: restaurant.google_place_id,
        restaurantName: restaurant.name,
      });
    }
  };

  const handleToggleBookmark = (restaurantId: string | number) => {
    if (!user?.id) return;
    setSelectedRestaurantForBookmark(restaurantId);
  };

  const handleEditGroupName = () => {
    if (!group) return;
    setOriginalGroupName(group.name); // Save current name before editing
    setIsEditingName(true);
  };

  const handleSaveGroupName = async () => {
    if (!group || group.name.trim() === originalGroupName) {
      setIsEditingName(false); // No change or invalid name, just exit editing
      return;
    }
    if (group.name.trim().length < 3) {
      Alert.alert(
        'Invalid Name',
        'Group name must be at least 3 characters long.',
      );
      // Revert to original name if invalid
      setGroup((prev) => (prev ? { ...prev, name: originalGroupName } : prev));
      setIsEditingName(false);
      return;
    }
    try {
      await updateGroupName(groupId, group.name.trim());
      Alert.alert('Success', 'Group name updated!');
      setIsEditingName(false);
      loadGroupDetails(); // Refresh details to ensure consistency
    } catch (error) {
      console.error('Failed to update group name:', error);
      Alert.alert('Error', 'Failed to update group name.');
      // Revert to original name on error
      setGroup((prev) => (prev ? { ...prev, name: originalGroupName } : prev));
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    if (!group) return;
    setGroup((prev) => (prev ? { ...prev, name: originalGroupName } : prev));
    setIsEditingName(false);
  };

  const handleChangeGroupPicture = async () => {
    if (!user?.id || !group?.id) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please grant media library permissions to upload an avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploadingAvatar(true);
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 200, height: 200 } }], // Resize for avatar
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );
        const publicUrl = await uploadGroupAvatar(group.id, manipResult.uri);
        setGroup((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
        Alert.alert('Success', 'Group avatar updated!');
      } catch (error) {
        console.error('Error uploading group avatar:', error);
        Alert.alert('Upload Failed', 'Could not upload group avatar.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const currentUserRole = group?.members.find(
    (m) => m.user_id === user?.id,
  )?.role;

  const handleMemberPress = (
    member: GroupMember & {
      profiles: {
        username: string;
        avatar_url?: string | null;
        avatarUrl?: string | null;
      };
    },
  ) => {
    if (!user?.id) return;
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;
    if (member.user_id === user.id) return; // Prevent modifying self

    const actions: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress: () => void;
    }[] = [];

    // 1. Dynamic Promotion Boundaries
    if (member.role === 'member') {
      actions.push({
        text: 'Promote to Trusted',
        onPress: async () => {
          try {
            await updateMemberRole(groupId, member.user_id, 'trusted');
            loadGroupDetails();
          } catch (error) {
            console.warn('Failed to promote member:', error);
          }
        },
      });
    }

    if (member.role === 'member' || member.role === 'trusted') {
      actions.push({
        text: 'Promote to Admin',
        onPress: () => {
          // Double Safety Confirmation
          Alert.alert(
            'Confirm Promotion',
            `Are you sure you want to make ${member.profiles?.username || member.user_id} an Admin?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Promote',
                onPress: async () => {
                  try {
                    await updateMemberRole(groupId, member.user_id, 'admin');
                    loadGroupDetails();
                  } catch (error) {
                    console.warn('Failed to promote member:', error);
                  }
                },
              },
            ],
          );
        },
      });
    }

    // 2. Dynamic Demotion Boundaries
    if (member.role === 'admin' || member.role === 'trusted') {
      actions.push({
        text: 'Demote to Member',
        onPress: async () => {
          try {
            await updateMemberRole(groupId, member.user_id, 'member');
            loadGroupDetails();
          } catch (error) {
            console.warn('Failed to demote member:', error);
          }
        },
      });
    }

    // 3. Destructive Eviction Bound (Admins cannot kick owners)
    if (member.role !== 'owner') {
      actions.push({
        text: 'Kick from Group',
        style: 'destructive',
        onPress: () => {
          // Double Safety Confirmation
          Alert.alert(
            'Confirm Kick',
            `Are you sure you want to remove ${member.profiles?.username || member.user_id} from the group?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Kick',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await removeGroupMember(groupId, member.user_id);
                    loadGroupDetails();
                  } catch (error) {
                    console.warn('Failed to kick member:', error);
                  }
                },
              },
            ],
          );
        },
      });
    }

    actions.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert(
      'Manage Member',
      `What would you like to do with ${member.profiles?.username || member.user_id}?`,
      actions,
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading group details...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>Group not found.</Text>
      </View>
    );
  }

  const isOwner = user?.id === group.created_by;

  const restaurantItems: ListItem[] =
    groupRestaurants.length > 0
      ? [
          { type: 'section_title', title: "Group's Rated Restaurants" },
          { type: 'restaurants', data: groupRestaurants },
        ]
      : [];

  const feedItems: ListItem[] = [];
  if (isFeedLoading) {
    feedItems.push({ type: 'loader', key: 'feed-loader' });
  } else if (feedError) {
    feedItems.push({ type: 'error', message: feedError, key: 'feed-error' });
  } else if (feedReviews.length === 0) {
    feedItems.push({
      type: 'empty',
      message: 'No feed activity yet.',
      key: 'feed-empty',
    });
  } else {
    feedItems.push(
      ...feedReviews
        .slice(0, 3)
        .map((review) => ({ type: 'feed_item', review }) as const),
    );
    if (feedReviews.length > 3) {
      feedItems.push({ type: 'feed_action_button', key: 'feed-action' });
    }
  }

  const memberItems: ListItem[] =
    group.members.length > 0
      ? group.members.map((member) => ({ type: 'member_item', member }))
      : [
          {
            type: 'empty',
            message: 'This group has no other members.',
            key: 'members-empty',
          },
        ];

  const listData: ListItem[] = [
    ...restaurantItems,
    { type: 'section_title', title: 'Group Feed' },
    ...feedItems,
    { type: 'section_title', title: 'Members' },
    ...memberItems,
  ];

  const renderListItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'section_title':
        return <Text style={styles.sectionTitle}>{item.title}</Text>;
      case 'restaurants':
        return (
          <FlatList
            data={item.data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(r) => r.id.toString()}
            renderItem={({ item: restaurant }) => (
              <View style={{ width: 280, marginRight: SIZES.padding }}>
                <RestaurantCard
                  item={restaurant}
                  onPress={handleRestaurantCardPress}
                  onPressReview={() =>
                    navigation.navigate('ReviewScreen', { restaurant })
                  }
                  isBookmarked={bookmarkedIds.has(restaurant.id.toString())}
                  onToggleBookmark={() => handleToggleBookmark(restaurant.id)}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: SIZES.padding }}
          />
        );
      case 'loader':
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        );
      case 'error':
        return (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{item.message}</Text>
          </View>
        );
      case 'empty':
        return (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{item.message}</Text>
          </View>
        );
      case 'feed_action_button':
        return (
          <View style={styles.centered}>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                navigation.navigate('GroupFeedScreen', {
                  groupId,
                  groupName: group.name,
                })
              }
            >
              <Text style={styles.viewAllButtonText}>View All Activity</Text>
            </TouchableOpacity>
          </View>
        );
      case 'feed_item':
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (item.review.restaurant?.google_place_id) {
                navigation.navigate('RestaurantDetail', {
                  restaurantId: item.review.restaurant.google_place_id,
                  restaurantName:
                    item.review.restaurant.name || 'Restaurant Details',
                });
              }
            }}
          >
            <FeedCard review={item.review} />
          </TouchableOpacity>
        );
      case 'member_item': {
        // Safely handle both single object and array-wrapped profile data from joins
        const profileData = Array.isArray(item.member.profiles)
          ? item.member.profiles[0]
          : item.member.profiles;
        const displayName = profileData?.username || 'Unknown Member';

        return (
          <TouchableOpacity
            style={styles.memberCard}
            onPress={() => handleMemberPress(item.member)}
          >
            <Avatar
              // Handle both snake_case and potential camelCase from different query paths
              url={profileData?.avatar_url || profileData?.avatarUrl}
              name={displayName}
              size={40}
            />
            <View style={styles.memberInfo}>
              <Text style={styles.memberText}>{displayName}</Text>
              <Text style={styles.memberRole}>
                Role: {item.member.role} (Weight: {item.member.weight})
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item: ListItem, index: number): string => {
          if ('review' in item) return item.review.id.toString();
          if ('member' in item) return item.member.user_id;
          if ('key' in item) return item.key;
          return `${item.type}-${index.toString()}`;
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.groupHeaderContent}>
              <TouchableOpacity
                style={styles.avatarEditContainer}
                onPress={handleChangeGroupPicture}
                disabled={isUploadingAvatar}
                accessibilityLabel="change-group-avatar-button"
              >
                <Avatar
                  url={group.avatar_url}
                  name={group.name}
                  size={80}
                  style={styles.groupAvatar}
                />
                {isUploadingAvatar ? (
                  <View
                    style={styles.avatarActivityIndicator}
                    testID="avatar-activity-indicator"
                  >
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  /* FIX: Render an anchor badge layout on the lower right instead of a full screen clobber */
                  isOwner && (
                    <View style={styles.avatarCameraBadge}>
                      <MaterialCommunityIcons
                        name="camera"
                        size={14}
                        color="#fff"
                      />
                    </View>
                  )
                )}
              </TouchableOpacity>

              {isEditingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.groupNameInput}
                    value={group.name}
                    onChangeText={(text: string) =>
                      setGroup((prev) =>
                        prev ? { ...prev, name: text } : prev,
                      )
                    }
                    autoFocus
                    onBlur={handleSaveGroupName}
                    onSubmitEditing={handleSaveGroupName}
                    maxLength={50}
                  />
                  <TouchableOpacity
                    onPress={handleSaveGroupName}
                    style={styles.nameEditButton}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEditName}
                    style={styles.nameEditButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameDisplayRow}>
                  <Text style={styles.title}>{group.name}</Text>
                  {isOwner && (
                    <TouchableOpacity
                      onPress={handleEditGroupName}
                      style={styles.editNameIcon}
                      accessibilityLabel="edit-name-button"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={20}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeText}>
                Code: {group.permanent_invite_code || 'Disabled'}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {group.permanent_invite_code && (
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => {
                      // Implement copy to clipboard logic here
                      Alert.alert(
                        'Copied!',
                        'Invite code copied to clipboard.',
                      );
                    }}
                  >
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                )}
                {isOwner && (
                  <TouchableOpacity
                    style={[styles.copyButton, { marginLeft: 8 }]}
                    onPress={handleTogglePermanentCode}
                  >
                    <Text style={styles.copyButtonText}>
                      {group.permanent_invite_code ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {group.permanent_invite_code ? (
              <View style={styles.inviteActionRow}>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() =>
                    handleShareCode(group.permanent_invite_code, false)
                  }
                >
                  <MaterialCommunityIcons
                    name="export-variant"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.inviteButtonText}>Share Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => setQrModalVisible(true)}
                >
                  <MaterialCommunityIcons
                    name="qrcode"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.inviteButtonText}>Show QR</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          isOwner ? (
            <View style={styles.ownerControls}>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateTempInvite}
              >
                <Text style={styles.generateButtonText}>
                  Generate Temporary Invite
                </Text>
              </TouchableOpacity>
              {tempCode && (
                <View style={styles.tempCodeWrapper}>
                  <Text style={styles.tempCodeLabel}>
                    Temporary Invite Ready:
                  </Text>
                  <Text style={styles.tempCodeText}>{tempCode}</Text>

                  <View style={styles.tempActionRow}>
                    <TouchableOpacity
                      style={styles.tempActionButton}
                      onPress={() => handleShareCode(tempCode, true)}
                    >
                      <MaterialCommunityIcons
                        name="export-variant"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.tempActionText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.tempActionButton}
                      onPress={() => {
                        setActiveQrCode(tempCode);
                        setQrModalVisible(true);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="qrcode"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.tempActionText}>QR Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeInvites.length > 0 ? (
                <View style={styles.invitesContainer}>
                  <TouchableOpacity
                    style={styles.invitesHeader}
                    onPress={() => setShowInvites(!showInvites)}
                  >
                    <Text style={styles.invitesTitle}>
                      {showInvites
                        ? 'Hide Active Invites'
                        : `Show Active Invites (${activeInvites.length})`}
                    </Text>
                    <MaterialCommunityIcons
                      name={showInvites ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                  {showInvites &&
                    activeInvites.map((inv) => (
                      <View key={inv.id} style={styles.inviteCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inviteCode}>{inv.code}</Text>
                          <Text style={styles.inviteMetaLeft}>
                            Created by: {inv.profiles?.username || 'Unknown'}
                          </Text>
                          <Text style={styles.inviteMetaLeft}>
                            Expires:{' '}
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </Text>
                        </View>

                        {/* Quick Row sharing links for historic active invites */}
                        <View style={styles.inviteRowActions}>
                          <TouchableOpacity
                            style={styles.inviteRowActionButton}
                            onPress={() => handleShareCode(inv.code, true)}
                          >
                            <MaterialCommunityIcons
                              name="export-variant"
                              size={16}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.inviteRowActionButton}
                            onPress={() => {
                              setActiveQrCode(inv.code);
                              setQrModalVisible(true);
                            }}
                          >
                            <MaterialCommunityIcons
                              name="qrcode"
                              size={16}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteGroup}
              >
                <Text style={styles.deleteButtonText}>Delete Group</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: SIZES.padding,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
      />

      <CollectionModal
        visible={!!selectedRestaurantForBookmark}
        restaurantId={selectedRestaurantForBookmark}
        userId={user?.id}
        onClose={() => {
          setSelectedRestaurantForBookmark(null);
          // Refresh bookmark state after modal closes
          if (user?.id) {
            fetchUserBookmarkedRestaurantIds(user.id)
              .then(setBookmarkedIds)
              .catch(console.error);
          }
        }}
      />

      <Modal
        visible={isQrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setQrModalVisible(false);
          setActiveQrCode(null);
        }}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan to Join</Text>

            {activeQrCode || group?.permanent_invite_code ? (
              <View style={styles.qrWrapper}>
                <QRCode
                  value={activeQrCode || group.permanent_invite_code}
                  size={200}
                  backgroundColor="#fff"
                  color="#000"
                />
              </View>
            ) : null}

            <Text style={styles.qrCodeText}>
              {activeQrCode || group?.permanent_invite_code}
            </Text>

            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => {
                setQrModalVisible(false);
                setActiveQrCode(null);
              }}
            >
              <Text style={styles.qrCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: {
    paddingVertical: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SIZES.largeRadius,
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: SIZES.base },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: { fontSize: 16, color: COLORS.textLight },
  copyButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: { fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  listContent: { paddingBottom: SIZES.largeRadius },
  memberCard: {
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.base,
    marginBottom: SIZES.base,
  },
  memberInfo: {
    marginLeft: SIZES.padding,
  },
  memberText: { fontSize: 16, fontWeight: 'bold' },
  memberRole: { fontSize: 14, color: COLORS.textLight },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
  },
  viewAllButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.base,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ownerControls: {
    marginTop: SIZES.padding,
    flexShrink: 1,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  generateButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  invitesContainer: {
    marginTop: SIZES.padding,
    flexShrink: 1,
  },
  invitesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  invitesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Centered to align the text block evenly with right actions
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.base,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inviteCode: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  deleteButton: {
    backgroundColor: COLORS.danger,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  deleteButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  inviteActionRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  qrCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginTop: 20,
    color: COLORS.primary,
  },
  qrCloseButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
  },
  qrCloseText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tempCodeWrapper: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    marginTop: SIZES.base,
  },
  tempCodeLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupHeaderContent: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  avatarEditContainer: {
    width: 80,
    height: 80,
    marginBottom: SIZES.base,
    position: 'relative', // Context anchor for lower-right boundary placement
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  avatarActivityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.base,
  },
  editNameIcon: {
    marginLeft: SIZES.base,
    padding: SIZES.base / 2,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
    width: '100%',
    paddingHorizontal: SIZES.padding,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    paddingVertical: 0, // Reset default TextInput padding
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  nameEditButton: {
    marginLeft: SIZES.base,
    padding: SIZES.base / 2,
  },
  inviteMetaLeft: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  inviteRowActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  inviteRowActionButton: {
    backgroundColor: '#f1f5f9',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempCodeText: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  tempActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tempActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  tempActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
