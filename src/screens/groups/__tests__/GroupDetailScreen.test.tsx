import React from 'react';
import { render, act } from '@testing-library/react-native';
import GroupDetailScreen from '../GroupDetailScreen';
import { fetchGroupDetails } from '../../../services/groupService';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../services/groupService', () => ({
  fetchGroupDetails: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useRoute: () => ({ params: { groupId: 'group_1' } }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(cb, []);
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

describe('GroupDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
