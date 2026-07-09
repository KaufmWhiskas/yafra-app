import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GroupDetailScreen from '../GroupDetailScreen';
import {
  fetchGroupDetails,
  createOneTimeInvite,
  fetchActiveInvites,
  updatePermanentInvite,
  updateMemberRole,
  removeGroupMember,
  fetchGroupRestaurants,
  updateGroupName,
  uploadGroupAvatar,
} from '../../../services/groupService';
import { useGroupFeed } from '../../../hooks/useGroupFeed';
import { useAuth } from '../../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../services/groupService', () => ({
  fetchGroupDetails: jest.fn(),
  createOneTimeInvite: jest.fn(),
  fetchActiveInvites: jest.fn(),
  deleteGroup: jest.fn(),
  updatePermanentInvite: jest.fn(),
  updateMemberRole: jest.fn(),
  removeGroupMember: jest.fn(),
  fetchGroupRestaurants: jest.fn(),
  updateGroupName: jest.fn(),
  uploadGroupAvatar: jest.fn(),
}));

jest.mock('../../../services/bookmarkService', () => ({
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
  // Add mocks for functions used by the nested CollectionModal
  fetchCollections: jest.fn().mockResolvedValue([]),
  fetchRestaurantSavedCollectionIds: jest.fn().mockResolvedValue(new Set()),
  createCollection: jest.fn(),
  toggleBookmarkInCollection: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useRoute: () => ({ params: { groupId: 'group_1' } }),
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(() => cb(), []);
    },
  };
});

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../hooks/useGroupFeed');

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

jest.spyOn(Alert, 'alert');

describe('GroupDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchActiveInvites as jest.Mock).mockResolvedValue([]);
    (fetchGroupRestaurants as jest.Mock).mockResolvedValue([]);
    (useGroupFeed as jest.Mock).mockReturnValue({
      reviews: [],
      isLoading: false,
      error: null,
    });
  });

  it('fetches and displays group name, invite code, and members on mount', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user_1' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      name: 'The Elite Squad',
      created_by: 'user_1',
      permanent_invite_code: 'ELITE123',
      members: [
        {
          user_id: 'user_1',
          role: 'owner',
          weight: 1,
          profiles: { username: 'user_1' },
        },
        {
          user_id: 'user_2',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'user_2' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(fetchGroupDetails).toHaveBeenCalledWith('group_1');
    expect(getByText('The Elite Squad')).toBeTruthy();
    expect(getByText('Code: ELITE123')).toBeTruthy();
    expect(getByText('user_1')).toBeTruthy();
    expect(getByText('Role: owner (Weight: 1)')).toBeTruthy();
    expect(getByText('user_2')).toBeTruthy();
    expect(getByText('Role: member (Weight: 0.5)')).toBeTruthy();
  });

  it("renders the 'Delete Group' button only if the current user is the owner", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      created_by: 'owner_user',
      members: [],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(getByText('Delete Group')).toBeTruthy();
  });

  it("hides the 'Delete Group' button if the current user is just a member", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'regular_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      created_by: 'owner_user',
      members: [],
    });

    const { queryByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(queryByText('Delete Group')).toBeNull();
  });

  describe('Group Name Editing', () => {
    it('Owner can see and trigger the name-editing icon/button', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'owner_user' } },
      });
      (fetchGroupDetails as jest.Mock).mockResolvedValue({
        id: 'group_1',
        name: 'Original Name',
        created_by: 'owner_user',
        members: [],
      });

      const { getByText, getByLabelText, getByDisplayValue } = render(
        <GroupDetailScreen />,
      );
      await flushMicrotasks();

      expect(getByText('Original Name')).toBeTruthy();
      const editButton = getByLabelText('edit-name-button'); // Assuming an accessibilityLabel
      fireEvent.press(editButton);

      expect(getByDisplayValue('Original Name')).toBeTruthy();
    });

    it('Non-owner cannot see the name-editing icon/button', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'member_user' } },
      });
      (fetchGroupDetails as jest.Mock).mockResolvedValue({
        id: 'group_1',
        name: 'Original Name',
        created_by: 'owner_user',
        members: [{ user_id: 'member_user', role: 'member', profiles: {} }],
      });

      const { queryByLabelText } = render(<GroupDetailScreen />);
      await flushMicrotasks();

      expect(queryByLabelText('edit-name-button')).toBeNull();
    });

    it('Owner can edit and save the group name', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'owner_user' } },
      });
      (fetchGroupDetails as jest.Mock).mockResolvedValue({
        id: 'group_1',
        name: 'Original Name',
        created_by: 'owner_user',
        members: [],
      });
      (updateGroupName as jest.Mock).mockResolvedValue(undefined);

      const { getByLabelText, getByDisplayValue, queryByDisplayValue } = render(
        <GroupDetailScreen />,
      );
      await flushMicrotasks();

      const editButton = getByLabelText('edit-name-button');
      fireEvent.press(editButton);

      const nameInput = getByDisplayValue('Original Name');
      fireEvent.changeText(nameInput, 'New Group Name');
      fireEvent(nameInput, 'submitEditing');

      await waitFor(() => {
        expect(updateGroupName).toHaveBeenCalledWith(
          'group_1',
          'New Group Name',
        );
      });

      expect(queryByDisplayValue('New Group Name')).toBeNull();
      expect(fetchGroupDetails).toHaveBeenCalledTimes(2); // Initial load + reload after update
    });
  });

  describe('Group Avatar Upload', () => {
    it('Owner can change group picture and upload service fires', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        session: { user: { id: 'owner_user' } },
      });
      (fetchGroupDetails as jest.Mock).mockResolvedValue({
        id: 'group_1',
        name: 'Test Group',
        created_by: 'owner_user',
        members: [],
      });
      (
        ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
      ).mockResolvedValue({ status: 'granted' });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://mock/image.jpg' }],
      });
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: 'file://mock/manipulated.jpg',
      });

      let resolveUpload: (value: string) => void;
      (uploadGroupAvatar as jest.Mock).mockImplementation(
        () =>
          new Promise((res) => {
            resolveUpload = res;
          }),
      );

      const { getByLabelText, findByTestId, queryByTestId } = render(
        <GroupDetailScreen />,
      );
      await flushMicrotasks();

      const avatarButton = getByLabelText('change-group-avatar-button');
      fireEvent.press(avatarButton);
      await findByTestId('avatar-activity-indicator');

      // Manually resolve the upload promise
      await act(async () => {
        resolveUpload('http://mock.url/avatar.jpg');
      });

      await waitFor(() => {
        expect(queryByTestId('avatar-activity-indicator')).toBeNull();
      });

      // Now assert that the upload function was called
      expect(uploadGroupAvatar).toHaveBeenCalledWith(
        'group_1',
        'file://mock/manipulated.jpg',
      );
    });
  });

  it('Owner can generate a one-time invite code', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user_1' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      name: 'The Elite Squad',
      created_by: 'user_1',
      permanent_invite_code: 'ELITE123',
      members: [],
    });
    (createOneTimeInvite as jest.Mock).mockResolvedValue('TEMP45');

    const { getByText, findByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    const generateBtn = getByText('Generate Temporary Invite');
    fireEvent.press(generateBtn);

    expect(createOneTimeInvite).toHaveBeenCalledWith('group_1', 'user_1');
    expect(await findByText('Temporary Invite Ready:')).toBeTruthy();
    expect(await findByText('TEMP45')).toBeTruthy();
  });

  it('Non-owners do not see invite generation controls', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user_2' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'user_1',
      members: [],
    });

    const { queryByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(queryByText('Generate Temporary Invite')).toBeNull();
  });

  it('toggles visibility of active temporary invites for the owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [],
    });
    (fetchActiveInvites as jest.Mock).mockResolvedValue([
      {
        id: 'inv_1',
        code: 'TEMP99',
        expires_at: new Date().toISOString(),
        profiles: { username: 'owner_user' },
      },
    ]);

    const { queryByText, getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(queryByText('TEMP99')).toBeNull();
    fireEvent.press(getByText('Show Active Invites (1)'));
    expect(getByText('TEMP99')).toBeTruthy();
    fireEvent.press(getByText('Hide Active Invites'));
    expect(queryByText('TEMP99')).toBeNull();
  });

  it('Owner can delete the group', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    const deleteBtn = getByText('Delete Group');
    fireEvent.press(deleteBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Group',
      'Are you sure? This cannot be undone.',
      expect.any(Array),
    );
  });

  it('Owner can disable and enable the permanent invite code', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      permanent_invite_code: 'CODE12',
      members: [],
    });

    const { getByText, rerender } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('Disable'));
    expect(updatePermanentInvite).toHaveBeenCalledWith('group_1', null);

    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      permanent_invite_code: null,
      members: [],
    });

    rerender(<GroupDetailScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('Enable'));
    expect(updatePermanentInvite).toHaveBeenCalledWith(
      'group_1',
      expect.any(String),
    );
  });

  it('Owner clicking a member displays appropriate options for "member" role', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [
        {
          user_id: 'owner_user',
          role: 'owner',
          weight: 1,
          profiles: { username: 'owner_user' },
        },
        {
          user_id: 'target_user',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'target_user' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    const targetMember = getByText(/target_user/);
    fireEvent.press(targetMember);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Manage Member',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Promote to Trusted' }),
        expect.objectContaining({ text: 'Promote to Admin' }),
        expect.objectContaining({ text: 'Kick from Group' }),
        expect.objectContaining({ text: 'Cancel' }),
      ]),
    );

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(alertArgs).not.toContainEqual(
      expect.objectContaining({ text: 'Demote to Member' }),
    );
  });

  it('Owner clicking an admin displays appropriate options for "admin" role', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [
        {
          user_id: 'owner_user',
          role: 'owner',
          weight: 1,
          profiles: { username: 'owner_user' },
        },
        {
          user_id: 'target_admin',
          role: 'admin',
          weight: 1,
          profiles: { username: 'target_admin' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    const targetMember = getByText(/target_admin/);
    fireEvent.press(targetMember);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Manage Member',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Demote to Member' }),
        expect.objectContaining({ text: 'Kick from Group' }),
        expect.objectContaining({ text: 'Cancel' }),
      ]),
    );

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(alertArgs).not.toContainEqual(
      expect.objectContaining({ text: 'Promote to Trusted' }),
    );
    expect(alertArgs).not.toContainEqual(
      expect.objectContaining({ text: 'Promote to Admin' }),
    );
  });

  it('Regular member clicking a member does nothing', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'regular_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [
        {
          user_id: 'owner_user',
          role: 'owner',
          weight: 1,
          profiles: { username: 'owner_user' },
        },
        {
          user_id: 'regular_user',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'regular_user' },
        },
        {
          user_id: 'target_user',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'target_user' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    const targetMember = getByText(/target_user/);
    fireEvent.press(targetMember);

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('triggers updateMemberRole when Promote to Admin is pressed', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [
        {
          user_id: 'owner_user',
          role: 'owner',
          weight: 1,
          profiles: { username: 'owner_user' },
        },
        {
          user_id: 'target_user',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'target_user' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText(/target_user/));

    // 1. Capture the exact buttons array passed to Alert.alert
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const buttons = alertCalls[0][2];

    // 2. Find the 'Promote to Admin' button configuration object
    const promoteBtn = buttons.find(
      (b: { text: string; onPress: () => void }) =>
        b.text === 'Promote to Admin',
    );

    // 3. Manually fire its onPress function
    await act(async () => {
      promoteBtn.onPress();
    });

    const confirmCalls = (Alert.alert as jest.Mock).mock.calls;
    const confirmButtons = confirmCalls[1][2];
    const confirmPromoteBtn = confirmButtons.find(
      (b: { text: string; onPress: () => void }) => b.text === 'Promote',
    );

    await act(async () => {
      confirmPromoteBtn.onPress();
    });

    // 4. Assert that the service was invoked with correct relational mutations
    expect(updateMemberRole).toHaveBeenCalledWith(
      'group_1',
      'target_user',
      'admin',
    );
    expect(fetchGroupDetails).toHaveBeenCalledTimes(2); // Initial mount + reload after update
  });

  it('triggers removeGroupMember when Kick from Group is pressed', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      created_by: 'owner_user',
      members: [
        {
          user_id: 'owner_user',
          role: 'owner',
          weight: 1,
          profiles: { username: 'owner_user' },
        },
        {
          user_id: 'target_user',
          role: 'member',
          weight: 0.5,
          profiles: { username: 'target_user' },
        },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText(/target_user/));

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const buttons = alertCalls[0][2];
    const kickBtn = buttons.find(
      (b: { text: string; onPress: () => void }) =>
        b.text === 'Kick from Group',
    );

    await act(async () => {
      kickBtn.onPress();
    });

    const confirmCalls = (Alert.alert as jest.Mock).mock.calls;
    const confirmButtons = confirmCalls[1][2];
    const confirmKickBtn = confirmButtons.find(
      (b: { text: string; onPress: () => void }) => b.text === 'Kick',
    );

    await act(async () => {
      confirmKickBtn.onPress();
    });

    expect(removeGroupMember).toHaveBeenCalledWith('group_1', 'target_user');
    expect(fetchGroupDetails).toHaveBeenCalledTimes(2);
  });
});
