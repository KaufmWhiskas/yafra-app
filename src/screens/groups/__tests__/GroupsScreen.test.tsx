import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import GroupsScreen from '../GroupsScreen';
import {
  fetchMyGroups,
  createGroup,
  joinGroupWithCode,
} from '../../../services/groupService';

jest.mock('../../../services/groupService', () => ({
  fetchMyGroups: jest.fn(),
  createGroup: jest.fn(),
  joinGroupWithCode: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(() => cb(), []);
    },
  };
});

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user_123' } } }),
}));

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('GroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it("fetches and displays the user's groups on mount", async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Burger Buddies',
        created_by: 'user_123',
        is_global: false,
        permanent_invite_code: 'code1',
        created_at: '2023-01-01',
      },
      {
        id: '2',
        name: 'Pizza Squad',
        created_by: 'user_456',
        is_global: false,
        permanent_invite_code: 'code2',
        created_at: '2023-01-02',
      },
    ]);

    const { getByText } = render(<GroupsScreen />);
    await flushMicrotasks();

    expect(fetchMyGroups).toHaveBeenCalledWith('user_123');
    expect(getByText('Burger Buddies')).toBeTruthy();
    expect(getByText('Pizza Squad')).toBeTruthy();
  });

  it('navigates to GroupDetailScreen when a group is pressed', async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Burger Buddies',
        created_by: 'user_123',
        is_global: false,
        permanent_invite_code: 'code1',
        created_at: '2023-01-01',
      },
    ]);

    const { getByText } = render(<GroupsScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('Burger Buddies'));

    expect(mockNavigate).toHaveBeenCalledWith('GroupDetailScreen', {
      groupId: '1',
    });
  });

  it('opens the Create Group modal when the fab is pressed', async () => {
    const { getByTestId, getByPlaceholderText } = render(<GroupsScreen />);
    await flushMicrotasks();

    fireEvent.press(getByTestId('create-group-button'));
    expect(getByPlaceholderText('Group Name')).toBeTruthy();
  });

  it('opens the Join Group modal when the join button is pressed', async () => {
    const { getByTestId, getByPlaceholderText } = render(<GroupsScreen />);
    await flushMicrotasks();

    fireEvent.press(getByTestId('join-group-button'));
    expect(getByPlaceholderText('Invite Code')).toBeTruthy();
  });

  it('calls createGroup and refreshes list when a new group is submitted', async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue([]);
    (createGroup as jest.Mock).mockResolvedValue({
      id: '3',
      name: 'New Test Group',
    });

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <GroupsScreen />,
    );
    await flushMicrotasks();

    // Open Modal
    fireEvent.press(getByTestId('create-group-button'));

    // Type in the input
    const input = getByPlaceholderText('Group Name');
    fireEvent.changeText(input, 'New Test Group');

    // Submit
    fireEvent.press(getByText('Create'));
    await flushMicrotasks();

    expect(createGroup).toHaveBeenCalledWith('user_123', 'New Test Group');
    // It should refresh the list after creation (fetch called twice: mount + post-create)
    expect(fetchMyGroups).toHaveBeenCalledTimes(2);
  });

  it('calls joinGroupWithCode and refreshes list when an invite code is submitted', async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue([]);
    (joinGroupWithCode as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <GroupsScreen />,
    );
    await flushMicrotasks();

    fireEvent.press(getByTestId('join-group-button'));

    const input = getByPlaceholderText('Invite Code');
    fireEvent.changeText(input, 'SECRET123');

    fireEvent.press(getByText('Join'));
    await flushMicrotasks();

    expect(joinGroupWithCode).toHaveBeenCalledWith('user_123', 'SECRET123');
    expect(fetchMyGroups).toHaveBeenCalledTimes(2);
  });
});
