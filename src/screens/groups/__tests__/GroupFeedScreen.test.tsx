import React from 'react';
import { render } from '@testing-library/react-native';
import { View as MockView, Text as MockText } from 'react-native';
import GroupFeedScreen from '../GroupFeedScreen';

jest.mock('../../../components/groups/GroupFeedList', () => {
  return jest.fn(({ groupId }: { groupId: string }) => (
    <MockView>
      <MockText>MockedGroupFeedList for {groupId}</MockText>
    </MockView>
  ));
});

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useRoute: () => ({
      params: { groupId: 'test_group_1', groupName: 'Test Group' },
    }),
    useNavigation: () => ({
      setOptions: mockSetOptions,
    }),
  };
});

describe('GroupFeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the GroupFeedList with the correct groupId from route params', () => {
    const { getByText } = render(<GroupFeedScreen />);
    expect(getByText('MockedGroupFeedList for test_group_1')).toBeTruthy();
  });

  it('sets the navigation header title to the group name', () => {
    render(<GroupFeedScreen />);
    expect(mockSetOptions).toHaveBeenCalledWith({ title: 'Test Group' });
  });
});
