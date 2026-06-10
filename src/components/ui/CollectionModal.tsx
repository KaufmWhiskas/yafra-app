import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import {
  BookmarkCollection,
  fetchCollections,
  createCollection,
  toggleBookmarkInCollection,
  fetchRestaurantSavedCollectionIds,
} from '../../services/bookmarkService';

interface CollectionModalProps {
  visible: boolean;
  restaurantId: string | number | null;
  userId: string | undefined;
  onClose: () => void;
}

export default function CollectionModal({
  visible,
  restaurantId,
  userId,
  onClose,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<Set<string>>(
    new Set(),
  );
  const [newCollectionName, setNewCollectionName] = useState('');
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // iOS provides smoother animations with 'Will', Android requires 'Did'
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!userId || !restaurantId) return;
    try {
      const [colls, savedIds] = await Promise.all([
        fetchCollections(userId),
        fetchRestaurantSavedCollectionIds(userId, restaurantId),
      ]);
      setCollections(colls);
      setSavedCollectionIds(savedIds);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }, [userId, restaurantId]);

  useEffect(() => {
    if (visible && userId && restaurantId) {
      loadData();
    }
  }, [visible, userId, restaurantId, loadData]);

  const handleToggle = async (collection: BookmarkCollection) => {
    if (!userId || !restaurantId) return;
    const isSaved = savedCollectionIds.has(collection.id);

    // Optimistic UI Update
    setSavedCollectionIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(collection.id);
      else next.add(collection.id);
      return next;
    });

    try {
      await toggleBookmarkInCollection(
        userId,
        restaurantId,
        collection.id,
        isSaved,
      );
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // Revert upon failure
      setSavedCollectionIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(collection.id);
        else next.delete(collection.id);
        return next;
      });
    }
  };

  const handleAddCollection = async () => {
    if (!userId || !newCollectionName.trim()) return;
    try {
      const newColl = await createCollection(userId, newCollectionName.trim());
      setCollections((prev) => [...prev, newColl]);
      setNewCollectionName('');
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Invisible background layer to handle tapping outside to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* The actual modal drawer */}
        <View
          style={[
            styles.container,
            {
              paddingBottom:
                Math.max(insets.bottom, SIZES.padding) + keyboardHeight,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Save to Collection</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={collections}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSaved = savedCollectionIds.has(item.id);
              return (
                <TouchableOpacity
                  style={styles.collectionRow}
                  onPress={() => handleToggle(item)}
                >
                  <MaterialCommunityIcons
                    name={
                      isSaved ? 'checkbox-marked' : 'checkbox-blank-outline'
                    }
                    size={24}
                    color={isSaved ? COLORS.primary : COLORS.textLight}
                  />
                  <Text style={styles.collectionName}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            style={styles.list}
          />

          <View style={styles.footer}>
            <TextInput
              style={styles.input}
              placeholder="New collection name"
              placeholderTextColor={COLORS.textLight}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCollection}
              disabled={!newCollectionName.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.largeRadius,
    borderTopRightRadius: SIZES.largeRadius,
    padding: SIZES.padding,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  list: {
    marginBottom: SIZES.padding,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collectionName: {
    fontSize: 16,
    marginLeft: 12,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SIZES.padding,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
