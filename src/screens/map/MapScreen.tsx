import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  fetchRestaurantDetails,
  fetchRestaurants,
} from '../../services/restaurantService';
import { COLORS } from '../../constants/theme';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import SearchBar from '../../components/ui/SearchBar';
import RestaurantList from '../../components/ui/RestaurantList';
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
  sortRestaurantsByDistance,
  filterWithinRadius,
} from '../../utils/geo';

const MAX_ZOOM_OUT = 0.1;

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 49.469805794737454,
    longitude: 8.422159691397045,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // disables useless eslint error
  // eslint-disable-next-line
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
      // 1. Instantly trigger the React UI update
      setSelectedRestaurant(restaurant);

      // 2. 🚨 SMART ZOOM LOGIC 🚨
      // If the user is already zoomed in closer than 0.005, we keep their current zoom level.
      // If they are zoomed out far away, we bring them into the 0.005 level.
      const targetLatDelta =
        mapRegion.latitudeDelta < 0.005 ? mapRegion.latitudeDelta : 0.005;
      const targetLonDelta =
        mapRegion.longitudeDelta < 0.005 ? mapRegion.longitudeDelta : 0.005;

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

      // 4. Fetch details
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
    [mapRegion.latitudeDelta, mapRegion.longitudeDelta],
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

        // Calculate the center of the scan area
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

  const sortedRestaurants = useMemo(() => {
    return sortRestaurantsByDistance(restaurants, {
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
  }, [restaurants, mapRegion.latitude, mapRegion.longitude]);

  const { scanRegion } = useMapScanner(loadData);

  const handleRegionChangeComplete = async (region: Region) => {
    setMapRegion((prev) => {
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
    } else if (!userLocation && !hasSetInitialLocation) {
      loadData(getRegionBBox(mapRegion)).finally(() => setIsLoading(false));
      setHasSetInitialLocation(true);
    }
  }, [userLocation, hasSetInitialLocation, mapRegion]);

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
          userLocation={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          }}
        />
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      {viewMode === 'map' ? (
        <RestaurantMap
          mapRef={mapRef}
          restaurants={
            mapRegion.latitudeDelta >= MAX_ZOOM_OUT ? [] : sortedRestaurants
          }
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={handleRestaurantSelect}
          onMapPress={() => {
            requestAnimationFrame(() => {
              setSelectedRestaurant(null);
            });
          }}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
          testID="mock-map"
          onPressReview={handleReviewPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : (
        <RestaurantList
          restaurants={sortedRestaurants}
          bookmarkedIds={bookmarkedIds}
          onPressReview={handleReviewPress}
          onToggleBookmark={handleToggleBookmark}
          userLocation={userLocation || undefined}
          contentContainerStyle={{ paddingTop: 175 }}
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
});
