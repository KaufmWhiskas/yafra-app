import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import {
  fetchCollectionSummaries,
  BookmarkCollection,
} from '../../services/bookmarkService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WantToVisitScreen() {
  const { session } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [collections, setCollections] = useState<
    (BookmarkCollection & { count: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (session?.user?.id) {
        try {
          const data = await fetchCollectionSummaries(session.user.id);
          setCollections(data);
        } catch (error) {
          console.error('Failed to load collections', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
  }, [session?.user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Lists</Text>
      </View>

      {isLoading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : collections.length === 0 ? (
        <Text style={styles.emptyText}>
          You haven't created any collections yet.
        </Text>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('CollectionDetailScreen', {
                  collectionId: item.id,
                  collectionName: item.name,
                })
              }
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="bookmark-multiple"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCount}>{item.count} places</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  emptyText: {
    padding: SIZES.padding,
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SIZES.padding * 2,
  },
  listContainer: { padding: SIZES.padding },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardCount: { fontSize: 14, color: COLORS.textLight },
});
