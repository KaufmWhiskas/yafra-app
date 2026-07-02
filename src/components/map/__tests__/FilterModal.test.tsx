import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FilterModal from '../FilterModal';
import { useAuth } from '../../../context/AuthContext';
import { fetchMyGroups } from '../../../services/groupService';

jest.mock('../../../context/AuthContext');
jest.mock('../../../services/groupService');

describe('FilterModal', () => {
  const mockOnApply = jest.fn();
  const mockOnClose = jest.fn();
  const initialFilters = {
    cuisine: null,
    minRating: null,
    onlyBookmarks: false,
    inAppReviewsOnly: false,
    targetGroupId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user1' } },
    });
    (fetchMyGroups as jest.Mock).mockResolvedValue([
      { id: 'group1', name: 'Test Group' },
    ]);
  });

  it('renders correctly and displays initial filters when visible', async () => {
    const { findByText } = render(
      <FilterModal
        visible={true}
        initialFilters={initialFilters}
        onApply={mockOnApply}
        onClose={mockOnClose}
      />,
    );

    expect(await findByText('Filters')).toBeTruthy();
    expect(await findByText('Cuisine')).toBeTruthy();
    expect(await findByText('All')).toBeTruthy();
    expect(await findByText('Any')).toBeTruthy();
    expect(await findByText('Test Group')).toBeTruthy();
  });

  it('calls onApply with updated filters when "Apply Filters" is pressed', async () => {
    const { getByText, findByText } = render(
      <FilterModal
        visible={true}
        initialFilters={initialFilters}
        onApply={mockOnApply}
        onClose={mockOnClose}
      />,
    );

    await findByText('Filters');

    fireEvent.press(getByText('Pizza & Italian'));
    fireEvent.press(getByText('4.5+'));

    fireEvent.press(getByText('Apply Filters'));

    expect(mockOnApply).toHaveBeenCalledWith({
      ...initialFilters,
      cuisine: 'Pizza & Italian',
      minRating: 4.5,
    });
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const { findByTestId } = render(
      <FilterModal
        visible={true}
        initialFilters={initialFilters}
        onApply={mockOnApply}
        onClose={mockOnClose}
      />,
    );

    const backdrop = await findByTestId('modal-backdrop');

    fireEvent.press(backdrop);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
