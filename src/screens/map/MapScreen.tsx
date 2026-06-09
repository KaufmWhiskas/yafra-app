import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  fetchRestaurantDetails,
  fetchRestaurants,
} from '../../services/restaurantService';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import SearchBar from '../../components/ui/SearchBar';
import RestaurantList from '../../components/ui/RestaurantList';
import QuickAddModal from '../../components/ui/QuickAddModal';
import CompassIcon from '../../components/ui/CompassIcon';
import { useMapScanner } from '../../hooks/useMapScanner';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks, toggleBookmark } from '../../services/bookmarkService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import MapView, { Region } from 'react-native-maps';
import { Prediction } from '../../services/searchService';
import {
  BoundingBox,
  getRegionBBox,
  filterWithinRadius,
  getClosestRestaurants,
} from '../../utils/geo';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MAX_ZOOM_OUT = 0.1;

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddRestaurants, setQuickAddRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [mapHeading, setMapHeading] = useState(0);

  // Suppress unused variable warning as hasLocationPermission is reserved for future fallback triggers.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hasLocationPermission, userLocation } = useLocation();

  const { session } = useAuth();
  const user = session?.user;

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const handleRestaurantSelect = useCallback(
    async (restaurant: Restaurant) => {
      setSelectedRestaurant(restaurant);

      // If the user is already zoomed in closer than 0.005, we keep their current zoom level.
      // If they are zoomed out far away, we bring them into the 0.005 level.
      const targetLatDelta =
        mapRegion && mapRegion.latitudeDelta < 0.005
          ? mapRegion.latitudeDelta
          : 0.005;
      const targetLonDelta =
        mapRegion && mapRegion.longitudeDelta < 0.005
          ? mapRegion.longitudeDelta
          : 0.005;

      // 3. Wait 250ms for the Visual Marker to finish its Pop Animation, THEN pan.
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

      if (restaurant.google_place_id && !restaurant.rating) {
        try {
          const details = await fetchRestaurantDetails(
            restaurant.google_place_id,
          );

          setSelectedRestaurant((prev) =>
            prev?.id === restaurant.id ? { ...prev, ...details } : prev,
          );
        } catch (error) {
          console.error(error);
        }
      }
    },
    [mapRegion],
  );

  const handleSearchSelect = async (place: Prediction) => {
    try {
      const details = await fetchRestaurantDetails(place.placeId);
      if (details.location) {
        const newRegion = {
          latitude: details.location.latitude,
          longitude: details.location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        setSelectedRestaurant(details as Restaurant);
      }
    } catch (error) {
      console.error('Failed to fetch place details from search:', error);
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

    // Query the map camera to find out if the user rotated the map
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      setMapHeading(camera.heading);
    }
  };

  const handleRegionChangeLive = async () => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      // Only update state if the heading actually changed by a noticeable amount to avoid React thrashing
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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getBookmarks(user.id)
          .then((bookmarks) => {
            setBookmarkedIds(new Set(bookmarks.map((b) => b.id.toString())));
          })
          .catch((error) => console.error('Failed to load bookmarks:', error));
      }
    }, [user?.id]),
  );

  const handleToggleBookmark = async (restaurantId: string | number) => {
    if (!user?.id) return;
    const idStr = restaurantId.toString();

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });

    try {
      await toggleBookmark(restaurantId, user.id);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleQuickAddPress = () => {
    if (userLocation) {
      const closest = getClosestRestaurants(restaurants, userLocation, 4);
      setQuickAddRestaurants(closest);
    } else if (mapRegion) {
      const center = {
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      };
      const closest = getClosestRestaurants(restaurants, center, 4);
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
      <View style={styles.floatingHeader} pointerEvents="box-none">
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
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      {viewMode === 'map' && mapRegion ? (
        <>
          <RestaurantMap
            mapRef={mapRef}
            restaurants={restaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={handleRestaurantSelect}
            onMapPress={() => {
              requestAnimationFrame(() => {
                setSelectedRestaurant(null);
              });
            }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
            testID="mock-map"
            onPressReview={handleReviewPress}
            onRegionChangeComplete={handleRegionChangeComplete}
            onRegionChange={handleRegionChangeLive}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />

          <TouchableOpacity
            style={[styles.fab, styles.compassFab]}
            onPress={handleCompassPress}
            testID="compass-button"
          >
            <CompassIcon rotation={-mapHeading} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fab,
              styles.invertedFab,
              selectedRestaurant ? { bottom: 190 } : { bottom: 100 },
            ]}
            onPress={handleMyLocationPress}
            testID="my-location-button"
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
              selectedRestaurant ? { bottom: 120 } : { bottom: 30 },
            ]}
            onPress={handleQuickAddPress}
            testID="quick-add-fab"
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <RestaurantList
          restaurants={restaurants}
          bookmarkedIds={bookmarkedIds}
          onPressReview={handleReviewPress}
          onToggleBookmark={handleToggleBookmark}
          userLocation={userLocation || undefined}
          contentContainerStyle={{ paddingTop: 175 }}
        />
      )}

      <QuickAddModal
        visible={quickAddVisible}
        restaurants={quickAddRestaurants}
        onSelect={(restaurant) => {
          setQuickAddVisible(false);
          navigation.navigate('ReviewScreen', { restaurant });
        }}
        onClose={() => setQuickAddVisible(false)}
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
    top: 60,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure search dropdown overlays the map
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
  },
  invertedFab: {
    backgroundColor: COLORS.surface,
  },
  compassFab: {
    top: 130,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Strips the primary color inherited from styles.fab
    elevation: 0, // Strips the inherited shadow
    shadowOpacity: 0, // Strips the inherited shadow
  },
});
