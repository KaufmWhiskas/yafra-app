import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { Alert } from 'react-native';
import { fetchUserStats } from '../../../services/profileService';
import { supabase } from '../../../services/supabase';

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
  useAuth: () => ({
    session: { user: { id: 'user_123', email: 'test@example.com' } },
  }),
}));

jest.mock('../../../services/profileService', () => ({
  fetchUserStats: jest.fn(),
}));

jest.mock('../../../services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.spyOn(Alert, 'alert');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserStats as jest.Mock).mockResolvedValue({
      username: 'cooltester',
      reviewCount: 5,
      uniqueRestaurantsVisited: 3,
      bookmarkCount: 12,
    });
  });

  it('renders username and aggregated stats on mount', async () => {
    const { findByText, getByText } = render(<ProfileScreen />);

    expect(await findByText('cooltester')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('12 places')).toBeTruthy();
    expect(fetchUserStats).toHaveBeenCalledWith('user_123');
  });

  it('navigates to WantToVisitScreen when the Want-To-Visit button is pressed', async () => {
    const { findByText } = render(<ProfileScreen />);

    const wantToVisitBtn = await findByText('Want to Visit');
    fireEvent.press(wantToVisitBtn);

    expect(mockNavigate).toHaveBeenCalledWith('WantToVisitScreen');
  });

  it('calls supabase.auth.signOut when the logout button is pressed', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });
    const { findByText, getByTestId } = render(<ProfileScreen />);

    await findByText('cooltester');

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Extract the onPress handler from the 'Sign Out' destructive button in the Alert
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const lastCall = alertCalls[alertCalls.length - 1];
    const buttons = lastCall[2];
    const signOutButton = buttons.find((b: { text: string; style: string }) => b.text === 'Sign Out');
    
    await signOutButton.onPress();

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
