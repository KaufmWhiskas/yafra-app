import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
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
} from '../../../services/groupService';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../services/groupService', () => ({
  fetchGroupDetails: jest.fn(),
  createOneTimeInvite: jest.fn(),
  fetchActiveInvites: jest.fn(),
  deleteGroup: jest.fn(),
  updatePermanentInvite: jest.fn(),
  updateMemberRole: jest.fn(),
  removeGroupMember: jest.fn(),
  fetchGroupRestaurants: jest.fn(),
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
        { user_id: 'user_1', role: 'owner', weight: 1 },
        { user_id: 'user_2', role: 'member', weight: 0.5 },
      ],
    });

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(fetchGroupDetails).toHaveBeenCalledWith('group_1');
    expect(getByText('The Elite Squad')).toBeTruthy();
    expect(getByText('Code: ELITE123')).toBeTruthy();
    expect(getByText('user_1 - owner (1)')).toBeTruthy();
    expect(getByText('user_2 - member (0.5)')).toBeTruthy();
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
    expect(await findByText('Temp Code: TEMP45')).toBeTruthy();
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

  it('fetches and displays active invite codes for the owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'owner_user' } },
    });
    (fetchGroupDetails as jest.Mock).mockResolvedValue({
      id: 'group_1',
      name: 'The Elite Squad',
      created_by: 'owner_user',
      permanent_invite_code: 'ELITE123',
      members: [],
    });
    (fetchActiveInvites as jest.Mock).mockResolvedValue([
      {
        id: 'inv_1',
        code: 'TEMP99',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        profiles: { username: 'owner_user' },
      },
    ]);

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(fetchActiveInvites).toHaveBeenCalledWith('group_1');
    expect(getByText('TEMP99')).toBeTruthy();
    expect(getByText('Created by: owner_user')).toBeTruthy();
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
        { user_id: 'owner_user', role: 'owner', weight: 1 },
        { user_id: 'target_user', role: 'member', weight: 0.5 },
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
        { user_id: 'owner_user', role: 'owner', weight: 1 },
        { user_id: 'target_admin', role: 'admin', weight: 1 },
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
        { user_id: 'owner_user', role: 'owner', weight: 1 },
        { user_id: 'regular_user', role: 'member', weight: 0.5 },
        { user_id: 'target_user', role: 'member', weight: 0.5 },
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
        { user_id: 'owner_user', role: 'owner', weight: 1 },
        { user_id: 'target_user', role: 'member', weight: 0.5 },
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
        { user_id: 'owner_user', role: 'owner', weight: 1 },
        { user_id: 'target_user', role: 'member', weight: 0.5 },
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

  it('fetches and displays group restaurants', async () => {
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
    (fetchGroupRestaurants as jest.Mock).mockResolvedValue([
      { id: 'r1', name: 'Elite Pizza', cuisine: 'pizza', rating: 4.5 },
    ]);

    const { getByText } = render(<GroupDetailScreen />);
    await flushMicrotasks();

    expect(fetchGroupRestaurants).toHaveBeenCalledWith('group_1');
    expect(getByText("Group's Rated Restaurants")).toBeTruthy();
    expect(getByText('Elite Pizza')).toBeTruthy();
  });
});
