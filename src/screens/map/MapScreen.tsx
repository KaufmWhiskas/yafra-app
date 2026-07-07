import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  fetchRestaurants,
  fetchRestaurantDetails,
} from '../../services/restaurantService';
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
  fetchActiveGroupsReviewsForRestaurantsBulk,
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

type RestaurantWithDistance = Restaurant & {
  distance: number | undefined;
  sortingDistance: number;
};

export default function MapScreen() {
  const isFocused = useIsFocused();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [isCameraAnimating, setIsCameraTransit] = useState(false);
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
      if (isGroupFilterLoading) return;

      if (activeGroupIds.length > 0 && restaurants.length > 0) {
        try {
          // Extract all IDs for the bulk query
          const restaurantIds = restaurants.map((r) => r.id.toString());

          // ONE network request instead of hundreds
          const bulkReviews = await fetchActiveGroupsReviewsForRestaurantsBulk(
            restaurantIds,
            activeGroupIds,
          );

          const scoredRestaurants = restaurants.map((restaurant) => {
            const groupReviews = bulkReviews[restaurant.id.toString()] || [];
            const groupScore = calculateGroupMapScore(groupReviews);

            if (groupScore > 0) {
              return { ...restaurant, app_rating: groupScore };
            }
            return restaurant;
          });

          setRestaurantsWithGroupScores(scoredRestaurants);
        } catch (error) {
          console.error('Failed bulk group score calculation:', error);
          setRestaurantsWithGroupScores(restaurants);
        }
      } else {
        setRestaurantsWithGroupScores(restaurants);
      }
    };

    applyGroupScores();
  }, [restaurants, activeGroupIds, isGroupFilterLoading]);

  const loadData = useCallback(async (bbox?: BoundingBox) => {
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
  }, []);

  // Memoize the list of restaurants with their distances calculated.
  // This only re-runs when the base restaurant list or the user/map location changes.
  const restaurantsWithDistance: RestaurantWithDistance[] = useMemo(() => {
    const center = mapRegion
      ? { latitude: mapRegion.latitude, longitude: mapRegion.longitude }
      : userLocation;

    if (!center) {
      return restaurantsWithGroupScores.map((r) => ({
        ...r,
        distance: undefined,
        sortingDistance: Infinity,
      }));
    }

    return restaurantsWithGroupScores.map((r) => {
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
      return { ...r, distance: displayDistance, sortingDistance };
    });
  }, [restaurantsWithGroupScores, mapRegion, userLocation]);

  // Memoize the final filtered and sorted list.
  // This re-runs when filters change, but it doesn't need to recalculate distances.
  const filteredRestaurants = useMemo(() => {
    let list = filterRestaurants(restaurantsWithDistance, {
      cuisine: filters.cuisine,
      minRating: filters.minRating,
      inAppReviewsOnly: filters.inAppReviewsOnly,
    }) as RestaurantWithDistance[];

    if (filters.onlyBookmarks) {
      list = list.filter((r) => bookmarkedIds.has(r.id.toString()));
    }

    if (filters.targetGroupId) {
      list = list.filter((r) => groupRestaurantIds.has(r.id.toString()));
    }

    // Sort the already-annotated list
    return list.sort((a, b) => a.sortingDistance - b.sortingDistance);
  }, [restaurantsWithDistance, filters, bookmarkedIds, groupRestaurantIds]);

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
    }, [user?.id, loadData]),
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

  const handleSearchSelect = async (place: Prediction) => {
    if (isScanning) return; // Prevent double-triggering if an ingest block is active

    try {
      // 1. Fetch exact geographic coordinates from cache/edge functions
      const details = await fetchRestaurantDetails(place.placeId);

      if (!details || details.latitude == null || details.longitude == null) {
        console.warn(
          '[MapScreen] Could not resolve coordinates for searched place',
        );
        return;
      }

      // 2. Identify the target viewport zoom framework based on Google's type classifications
      const isEstablishment = place.types?.some((t) =>
        [
          'restaurant',
          'cafe',
          'bar',
          'bakery',
          'meal_takeaway',
          'food',
          'establishment',
          'point_of_interest',
        ].includes(t),
      );

      const isCityOrRegion = place.types?.some((t) =>
        [
          'locality',
          'sublocality',
          'administrative_area_level_1',
          'administrative_area_level_2',
          'country',
        ].includes(t),
      );

      // Determine responsive camera frame spans based on context
      let latDelta = 0.01; // Safe mid-range zoom level for specific street addresses
      let lonDelta = 0.01;

      if (isEstablishment) {
        latDelta = 0.003; // Tight high-resolution focus directly over the venue
        lonDelta = 0.003;
      } else if (isCityOrRegion) {
        latDelta = 0.04; // Broad context view for matching entire city bounds
        lonDelta = 0.02;
      }

      const targetRegion: Region = {
        latitude: details.latitude,
        longitude: details.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
      };

      // 3. Acquire UI Lock & pan camera smoothly to destination coordinates
      setIsCameraTransit(true);
      setMapRegion(targetRegion);
      mapRegionRef.current = targetRegion;
      mapRef.current?.animateToRegion(targetRegion, 800);

      // 4. Construct presentation state parameters
      if (isEstablishment) {
        const restaurantName = place.description.split(',')[0];

        const parsedRestaurant: Restaurant = {
          id: details.id || place.placeId,
          name: details.name || restaurantName,
          cuisine: details.cuisine || 'restaurant',
          latitude: details.latitude,
          longitude: details.longitude,
          google_place_id: place.placeId,
          rating: details.rating,
          app_rating: details.app_rating,
          app_review_count: details.app_review_count,
          user_ratings_total: details.user_ratings_total,
          opening_hours: details.opening_hours,
        };

        // Open the bottom preview card layout floating on top of the map view!
        setSelectedRestaurant(parsedRestaurant);
      } else {
        // Clear any previous restaurant selection cards if a city or wide region is chosen
        setSelectedRestaurant(null);
      }

      // 5. Release UI lock cleanly after the 800ms animation has concluded
      setTimeout(() => {
        setIsCameraTransit(false);
      }, 850);
    } catch (error) {
      setIsCameraTransit(false);
      console.error(
        '[MapScreen] Search integration navigation failure:',
        error,
      );
    }
  };

  const { scanRegion, scanUserRadius, showScanButton, isScanning } =
    useMapScanner(loadData);

  useEffect(() => {
    if (userLocation) {
      // Keep a rolling cache alive around the user's feet while they walk or navigate
      scanUserRadius(userLocation);
    }
  }, [userLocation, scanUserRadius]);

  const handleRegionChangeComplete = async (region: Region) => {
    setMapRegion(region);
    mapRegionRef.current = region;
    scanRegion(region);

    if (mapRef.current) {
      try {
        const camera = await mapRef.current.getCamera();
        setMapHeading(camera.heading);
      } catch (error) {
        // Suppress transient map camera unmount rejections safely
        console.debug(
          '[MapScreen] Camera detached during region change complete:',
          error,
        );
      }
    }
  };

  const handleRegionChangeLive = async () => {
    if (mapRef.current) {
      try {
        const camera = await mapRef.current.getCamera();
        setMapHeading((prev) => {
          if (Math.abs(prev - camera.heading) > 1) return camera.heading;
          return prev;
        });
      } catch (error) {
        // Suppress transient map camera unmount rejections safely
        console.debug(
          '[MapScreen] Camera detached during live region change:',
          error,
        );
      }
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
  }, [userLocation, hasSetInitialLocation, loadData]);

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

      {showScanButton && (
        <View
          style={[
            styles.floatingButtonContainer,
            { bottom: selectedRestaurant ? previewHeight + 90 : 100 },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.disabledButton]}
            activeOpacity={0.85}
            disabled={isScanning} // Freeze interactions
            onPress={() => {
              if (mapRegionRef.current) {
                scanRegion(mapRegionRef.current, true);
              }
            }}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning area...' : 'Search this area'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Absolute fullscreen touch barrier active only during camera movements */}
      {isCameraAnimating && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'transparent', zIndex: 99999 },
          ]}
          pointerEvents="auto"
        />
      )}
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
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 102, // Layer above FAB items to ensure interaction focus
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  disabledButton: {
    backgroundColor: '#EFEFEF',
    opacity: 0.7,
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
