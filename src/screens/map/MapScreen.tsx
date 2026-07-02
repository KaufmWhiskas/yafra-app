import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchRestaurants } from '../../services/restaurantService';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant, Prediction } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import SearchBar from '../../components/ui/SearchBar';
import RestaurantCard from '../../components/ui/RestaurantCard';
import RestaurantList from '../../components/ui/RestaurantList';
import QuickAddModal from '../../components/ui/QuickAddModal';
import FilterModal, { Filters } from '../../components/map/FilterModal';
import CompassIcon from '../../components/ui/CompassIcon';
import { useMapScanner } from '../../hooks/useMapScanner';
import { useAuth } from '../../context/AuthContext';
import { fetchUserBookmarkedRestaurantIds } from '../../services/bookmarkService';
import {
  fetchGroupReviewedRestaurantIds,
  fetchActiveGroupsReviewsForRestaurant,
} from '../../services/groupService';
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
  ParamListBase,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import MapView, { Region } from 'react-native-maps';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  BoundingBox,
  getRegionBBox,
  filterWithinRadius,
  calculateDistance,
  getClosestRestaurants,
} from '../../utils/geo';
import { filterRestaurants } from '../../utils/restaurantFilters';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CollectionModal from '../../components/ui/CollectionModal';
import { useActiveGroupFilters } from '../../hooks/useActiveGroupFilters';
import { calculateGroupMapScore } from '../../utils/groupMath';

const MAX_ZOOM_OUT = 0.1;

export default function MapScreen() {
  const isFocused = useIsFocused();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapRegionRef = useRef<Region | null>(null);
  mapRegionRef.current = mapRegion;

  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddRestaurants, setQuickAddRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [selectedRestaurantForBookmark, setSelectedRestaurantForBookmark] =
    useState<string | number | null>(null);
  const [mapHeading, setMapHeading] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    cuisine: null,
    minRating: null,
    onlyBookmarks: false,
    inAppReviewsOnly: false,
    targetGroupId: null,
  });
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Suppress unused variable warning as hasLocationPermission is reserved for future fallback triggers.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasLocationPermission, userLocation } = useLocation();

  const { session } = useAuth();
  const user = session?.user;

  const { activeGroupIds, isFilterLoading: isGroupFilterLoading } =
    useActiveGroupFilters();

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [groupRestaurantIds, setGroupRestaurantIds] = useState<Set<string>>(
    new Set(),
  );

  const [restaurantsWithGroupScores, setRestaurantsWithGroupScores] = useState<
    Restaurant[]
  >([]);

  useEffect(() => {
    if (filters.targetGroupId) {
      fetchGroupReviewedRestaurantIds(filters.targetGroupId)
        .then((ids) => setGroupRestaurantIds(ids))
        .catch((err) =>
          console.error('Failed to fetch group restaurant IDs:', err),
        );
    } else {
      setGroupRestaurantIds(new Set());
    }
  }, [filters.targetGroupId]);

  useEffect(() => {
    const applyGroupScores = async () => {
      if (isGroupFilterLoading) {
        return;
      }

      if (activeGroupIds.length > 0) {
        const scoredRestaurants = await Promise.all(
          restaurants.map(async (restaurant) => {
            const groupReviews = await fetchActiveGroupsReviewsForRestaurant(
              restaurant.id.toString(),
              activeGroupIds,
            );
            const groupScore = calculateGroupMapScore(groupReviews);

            if (groupScore > 0) {
              // Override app_rating for display purposes
              return { ...restaurant, app_rating: groupScore };
            }
            return restaurant;
          }),
        );
        setRestaurantsWithGroupScores(scoredRestaurants);
      } else {
        setRestaurantsWithGroupScores(restaurants);
      }
    };

    applyGroupScores();
  }, [restaurants, activeGroupIds, isGroupFilterLoading]);

  const filteredRestaurants = useMemo(() => {
    let list = filterRestaurants(restaurantsWithGroupScores, {
      cuisine: filters.cuisine,
      minRating: filters.minRating,
      inAppReviewsOnly: filters.inAppReviewsOnly,
    });

    if (filters.onlyBookmarks) {
      list = list.filter((r) => bookmarkedIds.has(r.id.toString()));
    }

    if (filters.targetGroupId) {
      list = list.filter((r) => groupRestaurantIds.has(r.id.toString()));
    }

    if (mapRegion) {
      const center = {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      };

      list = list
        .map((r) => {
          const sortingDistance = calculateDistance(center, {
            latitude: r.latitude,
            longitude: r.longitude,
          });

          const displayDistance = userLocation
            ? calculateDistance(userLocation, {
                latitude: r.latitude,
                longitude: r.longitude,
              })
            : sortingDistance;

          return {
            ...r,
            distance: displayDistance,
            sortingDistance: sortingDistance,
          };
        })
        .sort((a, b) => (a.sortingDistance ?? 0) - (b.sortingDistance ?? 0));
    }

    return list;
  }, [
    restaurantsWithGroupScores,
    filters,
    bookmarkedIds,
    groupRestaurantIds,
    mapRegion,
    userLocation,
  ]);

  useFocusEffect(
    useCallback(() => {
      setViewMode('map');

      if (user?.id) {
        fetchUserBookmarkedRestaurantIds(user.id)
          .then((ids) => {
            setBookmarkedIds(ids);
          })
          .catch((error) => console.error('Failed to load bookmarks:', error));
      }

      if (mapRegionRef.current) {
        loadData(getRegionBBox(mapRegionRef.current));
      }
    }, [user?.id]),
  );

  useEffect(() => {
    const tabNavigation =
      navigation.getParent<BottomTabNavigationProp<ParamListBase>>();
    if (!tabNavigation) return;

    const unsubscribe = tabNavigation.addListener('tabPress', (e) => {
      if (isFocused) {
        e.preventDefault();
        setViewMode('map');
      }
    });

    return unsubscribe;
  }, [navigation, isFocused]);

  const handleItemPress = (restaurant: Restaurant) => {
    if (restaurant.google_place_id) {
      navigation.navigate('RestaurantDetail', {
        restaurantId: restaurant.google_place_id,
        restaurantName: restaurant.name,
      });
    } else {
      console.warn(
        'Cannot view details for a restaurant without a google_place_id',
      );
    }
  };

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const handleRestaurantSelect = useCallback(
    async (restaurant: Restaurant) => {
      setSelectedRestaurant(restaurant);

      const targetLatDelta =
        mapRegion && mapRegion.latitudeDelta < 0.005
          ? mapRegion.latitudeDelta
          : 0.005;
      const targetLonDelta =
        mapRegion && mapRegion.longitudeDelta < 0.005
          ? mapRegion.longitudeDelta
          : 0.005;

      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            latitudeDelta: targetLatDelta,
            longitudeDelta: targetLonDelta,
          },
          600,
        );
      }, 250);
    },
    [mapRegion],
  );

  const handleSearchSelect = (place: Prediction) => {
    try {
      const restaurantName = place.description.split(',')[0];

      navigation.navigate('RestaurantDetail', {
        restaurantId: place.placeId,
        restaurantName: restaurantName,
      });
    } catch (error) {
      console.error('[MapScreen] Search navigation failure:', error);
    }
  };

  const loadData = async (bbox?: BoundingBox) => {
    try {
      if (!bbox) return;
      const data = await fetchRestaurants(bbox);

      setRestaurants((prev) => {
        const merged = new Map<string, Restaurant>();

        [...prev, ...(data || [])].forEach((r) => {
          merged.set(r.id.toString(), r);
        });

        const scanCenter = {
          latitude: (bbox.minLat + bbox.maxLat) / 2,
          longitude: (bbox.minLon + bbox.maxLon) / 2,
        };

        return filterWithinRadius(Array.from(merged.values()), scanCenter, 15);
      });
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    }
  };

  const { scanRegion } = useMapScanner(loadData);

  const handleRegionChangeComplete = async (region: Region) => {
    setMapRegion((prev) => {
      if (!prev) return region;
      const hasChanged =
        Math.abs(prev.latitude - region.latitude) > 0.0001 ||
        Math.abs(prev.longitude - region.longitude) > 0.0001 ||
        Math.abs(prev.latitudeDelta - region.latitudeDelta) > 0.0001 ||
        Math.abs(prev.longitudeDelta - region.longitudeDelta) > 0.0001;

      return hasChanged ? region : prev;
    });

    if (region.latitudeDelta < MAX_ZOOM_OUT) {
      scanRegion(region);
    }

    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      setMapHeading(camera.heading);
    }
  };

  const handleRegionChangeLive = async () => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      setMapHeading((prev) => {
        if (Math.abs(prev - camera.heading) > 1) return camera.heading;
        return prev;
      });
    }
  };

  const [hasSetInitialLocation, setHasSetInitialLocation] = useState(false);

  useEffect(() => {
    if (userLocation && !hasSetInitialLocation) {
      const initialRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.02,
      };
      setMapRegion(initialRegion);
      mapRef.current?.animateToRegion(initialRegion, 1000);
      setHasSetInitialLocation(true);

      loadData(getRegionBBox(initialRegion)).finally(() => setIsLoading(false));
    }
  }, [userLocation, hasSetInitialLocation]);

  const handleToggleBookmark = (restaurantId: string | number) => {
    if (!user?.id) return;
    setSelectedRestaurantForBookmark(restaurantId);
  };

  const handleQuickAddPress = () => {
    if (userLocation) {
      const closest = getClosestRestaurants(
        filteredRestaurants,
        userLocation,
        4,
      );
      setQuickAddRestaurants(closest);
    } else if (mapRegion) {
      const center = {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      };
      const closest = getClosestRestaurants(filteredRestaurants, center, 4);
      setQuickAddRestaurants(closest);
    }
    setQuickAddVisible(true);
  };

  const handleMyLocationPress = () => {
    if (userLocation) {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          zoom: 15,
        },
        { duration: 500 },
      );
    }
  };

  const handleCompassPress = () => {
    setMapHeading(0);
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 400 });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading restaurants from database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.floatingHeader, { top: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              onPlaceSelect={handleSearchSelect}
              userLocation={
                mapRegion
                  ? {
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                    }
                  : undefined
              }
            />
          </View>
        </View>
        {/* Add a spacer here to push the toggle down */}
        <View style={{ height: 16 }} />
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      {viewMode === 'map' && mapRegion && isFocused ? (
        <>
          <RestaurantMap
            mapRef={mapRef}
            restaurants={filteredRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={handleRestaurantSelect}
            onMapPress={() => {
              requestAnimationFrame(() => {
                setSelectedRestaurant(null);
              });
            }}
            region={mapRegion}
            testID="mock-map"
            onRegionChangeComplete={handleRegionChangeComplete}
            onRegionChange={handleRegionChangeLive}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />

          {selectedRestaurant && (
            <View
              testID="floating-preview-card"
              style={styles.floatingCardContainer}
              onLayout={(e) => setPreviewHeight(e.nativeEvent.layout.height)}
            >
              <RestaurantCard
                item={selectedRestaurant}
                onPress={handleItemPress}
                onPressReview={() => handleReviewPress(selectedRestaurant)}
                isBookmarked={bookmarkedIds.has(
                  selectedRestaurant.id.toString(),
                )}
                onToggleBookmark={() =>
                  handleToggleBookmark(selectedRestaurant.id)
                }
                distance={
                  userLocation &&
                  selectedRestaurant.latitude != null &&
                  selectedRestaurant.longitude != null
                    ? calculateDistance(userLocation, {
                        latitude: selectedRestaurant.latitude,
                        longitude: selectedRestaurant.longitude,
                      })
                    : undefined
                }
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.fab, styles.compassFab]}
            onPress={handleCompassPress}
            testID="compass-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CompassIcon rotation={-mapHeading} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              styles.invertedFab,
              { bottom: selectedRestaurant ? previewHeight + 100 : 100 },
            ]}
            onPress={handleMyLocationPress}
            testID="my-location-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={30}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              styles.invertedFab,
              styles.smallFab,
              styles.filterFab,
            ]}
            onPress={() => setFilterModalVisible(true)}
            testID="filter-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              { bottom: selectedRestaurant ? previewHeight + 30 : 30 },
            ]}
            onPress={handleQuickAddPress}
            testID="quick-add-fab"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </>
      ) : viewMode === 'list' && isFocused ? (
        <RestaurantList
          restaurants={filteredRestaurants}
          bookmarkedIds={bookmarkedIds}
          onPressItem={handleItemPress}
          onPressReview={handleReviewPress}
          onToggleBookmark={handleToggleBookmark}
          contentContainerStyle={{ paddingTop: 175 }}
        />
      ) : null}

      <QuickAddModal
        visible={quickAddVisible}
        restaurants={quickAddRestaurants}
        onSelect={(restaurant) => {
          setQuickAddVisible(false);
          navigation.navigate('ReviewScreen', { restaurant });
        }}
        onClose={() => setQuickAddVisible(false)}
      />

      <FilterModal
        visible={isFilterModalVisible}
        initialFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onClose={() => setFilterModalVisible(false)}
      />

      <CollectionModal
        visible={!!selectedRestaurantForBookmark}
        restaurantId={selectedRestaurantForBookmark}
        userId={user?.id}
        onClose={() => {
          setSelectedRestaurantForBookmark(null);
          if (user?.id) {
            fetchUserBookmarkedRestaurantIds(user.id)
              .then(setBookmarkedIds)
              .catch(console.error);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  floatingHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100, // Ensure search dropdown overlays the map
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 101, // Force FABs above the floatingHeader (zIndex: 100)
  },
  invertedFab: {
    backgroundColor: COLORS.surface,
  },
  compassFab: {
    top: 130,
    width: 44,
    height: 44,
    borderRadius: 22, // Matches smallFab circle radius perfectly
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface, // Gives identical material contrast background
    elevation: 4, // Aligns dropshadow depth with filterFab elevation rules
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  smallFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterFab: {
    top: 184, // Suspends button precisely below the aligned compass wrapper
  },
  floatingCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: SIZES.padding,
    right: SIZES.padding,
    zIndex: 100,
  },
});
