import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  searchUsersByUsername,
} from '../friendService';
import { supabase } from '../supabase';
import { unlockDirectEvent } from '../achievementService';

jest.mock('../supabase');
jest.mock('../achievementService');

// Cast the imported supabase object to its mocked type to get type safety.
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

describe('friendService', () => {
  const mockImplementation = {
    insert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockResolvedValue({ data: [], error: null }),
    ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedSupabase.from as jest.Mock).mockReturnValue(mockImplementation);
    mockImplementation.eq.mockReturnThis();
    mockImplementation.ilike.mockResolvedValue({ data: [], error: null });
    (unlockDirectEvent as jest.Mock).mockClear();
  });

  describe('sendFriendRequest', () => {
    it('should call insert with the correct payload and pending status', async () => {
      const requesterId = 'user-1';
      const addresseeId = 'user-2';

      await sendFriendRequest(requesterId, addresseeId);

      expect(mockedSupabase.from).toHaveBeenCalledWith('user_relationships');
      expect(mockImplementation.insert).toHaveBeenCalledWith({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      });
    });

    it('should throw an error if supabase insert fails', async () => {
      const dbError = new Error('DB insert failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockImplementation.insert.mockResolvedValueOnce({ error: dbError });

      await expect(sendFriendRequest('user-1', 'user-2')).rejects.toThrow(
        dbError,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('acceptFriendRequest', () => {
    it('should update status to "accepted" and grant achievements on success', async () => {
      const relationshipId = 'rel-123';
      const mockRelationship = {
        requester_id: 'user-1',
        addressee_id: 'user-2',
      };

      (mockedSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockRelationship,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

      await acceptFriendRequest(relationshipId);

      expect(unlockDirectEvent).toHaveBeenCalledWith(
        'EVENT_SOCIAL_FRIEND',
        'user-1',
      );
      expect(unlockDirectEvent).toHaveBeenCalledWith(
        'EVENT_SOCIAL_FRIEND',
        'user-2',
      );
    });

    it('should throw an error if fetching the relationship fails', async () => {
      const dbError = new Error('DB fetch failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (mockedSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
      });

      await expect(acceptFriendRequest('rel-123')).rejects.toThrow(
        'Failed to find friend request to accept.',
      );
      consoleErrorSpy.mockRestore();
    });

    it('should throw an error if the update fails', async () => {
      const dbError = new Error('DB update failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (mockedSupabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { requester_id: 'user-1', addressee_id: 'user-2' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: dbError }),
        });

      await expect(acceptFriendRequest('rel-123')).rejects.toThrow(dbError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('rejectFriendRequest', () => {
    it('should call delete for the specific relationship ID', async () => {
      mockImplementation.eq.mockResolvedValue({ error: null });
      const relationshipId = 'rel-123';

      await rejectFriendRequest(relationshipId);

      expect(mockedSupabase.from).toHaveBeenCalledWith('user_relationships');
      expect(mockImplementation.delete).toHaveBeenCalled();
      expect(mockImplementation.eq).toHaveBeenCalledWith('id', relationshipId);
    });

    it('should throw an error if supabase delete fails', async () => {
      const dbError = new Error('DB delete failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockImplementation.eq.mockResolvedValue({ error: dbError });

      await expect(rejectFriendRequest('rel-123')).rejects.toThrow(dbError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getFriends', () => {
    it('should query for accepted relationships joined with sender/receiver profile metadata', async () => {
      const currentUserId = 'user-me';
      await getFriends(currentUserId);

      expect(mockedSupabase.from).toHaveBeenCalledWith('user_relationships');

      // Enforce specific profile key extraction rather than broad wildcards
      expect(mockImplementation.select).toHaveBeenCalledWith(`
      *,
      requester:profiles!requester_id(id, username, avatar_url),
      addressee:profiles!addressee_id(id, username, avatar_url)
    `);

      expect(mockImplementation.eq).toHaveBeenCalledWith('status', 'accepted');
      expect(mockImplementation.or).toHaveBeenCalledWith(
        `requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`,
      );
    });

    it('should throw an error if supabase select fails', async () => {
      const dbError = new Error('DB select failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockImplementation.or.mockResolvedValue({ data: null, error: dbError });

      await expect(getFriends('user-me')).rejects.toThrow(dbError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('searchUsersByUsername', () => {
    it('should call select with an ilike filter on the profiles table', async () => {
      const searchQuery = 'test';
      await searchUsersByUsername(searchQuery);

      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockImplementation.select).toHaveBeenCalledWith(
        'id, username, avatar_url',
      );
      expect(mockImplementation.ilike).toHaveBeenCalledWith(
        'username',
        `%${searchQuery}%`,
      );
    });

    it('should throw an error if supabase select with ilike fails', async () => {
      const dbError = new Error('DB search failed');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockImplementation.ilike.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      await expect(searchUsersByUsername('test')).rejects.toThrow(dbError);

      consoleErrorSpy.mockRestore();
    });
  });
});
