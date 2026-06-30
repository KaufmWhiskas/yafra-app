import React from 'react';
import { render, fireEvent, act, within } from '@testing-library/react-native';
import GroupsScreen from '../GroupsScreen';
import { fetchMyGroups } from '../../../services/groupService'; // Corrected path
import { useActiveGroupFilters } from '../../../hooks/useActiveGroupFilters'; // Corrected path
import { useAuth } from '../../../context/AuthContext'; // Corrected path

jest.mock('../../../services/groupService', () => ({
  fetchMyGroups: jest.fn(),
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
  useAuth: jest.fn(),
}));

jest.mock('../../../hooks/useActiveGroupFilters');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

const mockGroups = [
  { id: '1', name: 'Active Group', created_by: 'user_123' },
  { id: '2', name: 'Inactive Group', created_by: 'user_456' },
  { id: '3', name: 'Another Active Group', created_by: 'user_123' },
];

const mockToggleGroupFilter = jest.fn();

describe('GroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user_123' } },
    });
  });

  it('shows an activity indicator while loading and then the group list', async () => {
    let resolveFetch: (value: unknown) => void;
    (fetchMyGroups as jest.Mock).mockImplementation(
      () => new Promise((res) => (resolveFetch = res)),
    );
    (useActiveGroupFilters as jest.Mock).mockReturnValue({
      activeGroupIds: [],
      toggleGroupFilter: jest.fn(),
    });

    const { queryByText, findByText, getByTestId } = render(<GroupsScreen />);

    // The ActivityIndicator should be visible while loading
    expect(getByTestId('activity-indicator')).toBeTruthy();
    expect(queryByText('Food Circles')).toBeNull();

    // Resolve the fetch to simulate data loading completion
    await act(async () => {
      resolveFetch(mockGroups);
    });

    // Now, the main content should be rendered
    expect(await findByText('Food Circles')).toBeTruthy();
    expect(await findByText('Active Group')).toBeTruthy();
  });

  it('correctly splits groups into "Active" and "Inactive" sections', async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue(mockGroups);
    (useActiveGroupFilters as jest.Mock).mockReturnValue({
      activeGroupIds: ['1', '3'], // Two active groups
      toggleGroupFilter: mockToggleGroupFilter,
    });

    const { findByText } = render(<GroupsScreen />);

    // Check for section headers with correct counts
    expect(await findByText('Active Map Feeds (2)')).toBeTruthy();
    expect(await findByText('Other Circles')).toBeTruthy();

    // Check that all group names are rendered
    expect(await findByText('Active Group')).toBeTruthy();
    expect(await findByText('Inactive Group')).toBeTruthy();
    expect(await findByText('Another Active Group')).toBeTruthy();
  });

  it('calls toggleGroupFilter with the correct groupId when a switch is toggled', async () => {
    (fetchMyGroups as jest.Mock).mockResolvedValue(mockGroups);
    (useActiveGroupFilters as jest.Mock).mockReturnValue({
      activeGroupIds: ['1'], // Start with one active group
      toggleGroupFilter: mockToggleGroupFilter,
    });

    const { getByText } = render(<GroupsScreen />);
    await flushMicrotasks();

    // Find the card for "Inactive Group" by its text content
    const inactiveGroupCard = getByText('Inactive Group').parent.parent.parent;

    // Use `within` to scope queries to just this card
    const { getByRole } = within(inactiveGroupCard);

    // Find the switch inside the card and fire the event
    const switchComponent = getByRole('switch');
    expect(switchComponent.props.value).toBe(false); // It should be off
    fireEvent(switchComponent, 'onValueChange');

    // Assert that the toggle function was called with the correct group ID
    expect(mockToggleGroupFilter).toHaveBeenCalledWith('2');
    expect(mockToggleGroupFilter).toHaveBeenCalledTimes(1);
  });
});
