import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ImageBackground,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useAppData } from '../context/AppDataContext';
import { getCategoryLabel, getImageSource } from '../utils/placeMeta';
import { useTranslation } from '../context/TranslationContext';
import colors from '../theme/colors';
import { logWarning } from '../utils/logger';

const NEARBY_RADIUS_KM = 30;

const CITY_PRIORITY = ['tirana', 'durres', 'vlore', 'gjirokaster'];

const normalizeCityKey = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const getCitySortKey = (city) => normalizeCityKey(city?.legacyId || city?.id || city?.name);

const getCityPriority = (city) => {
  const cityKeys = [city?.legacyId, city?.id, city?.name, city?.city_name].map(
    normalizeCityKey
  );

  return CITY_PRIORITY.findIndex((priorityKey) =>
    cityKeys.some((cityKey) => cityKey === priorityKey)
  );
};

const getStableRandomScore = (city) => {
  const key = getCitySortKey(city);
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 9973;
  }

  return hash;
};

const idsMatch = (left, right) =>
  left === right || String(left) === String(right);

const idListIncludes = (ids, id) =>
  (ids || []).some((selectedId) => idsMatch(selectedId, id));

const toggleIdInList = (ids, id) =>
  idListIncludes(ids, id)
    ? ids.filter((selectedId) => !idsMatch(selectedId, id))
    : [...ids, id];

const removeIdFromList = (ids, id) =>
  ids.filter((selectedId) => !idsMatch(selectedId, id));

const calculateDistanceKm = (userLat, userLng, placeLat, placeLng) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(placeLat - userLat);
  const dLon = toRad(placeLng - userLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLat)) *
      Math.cos(toRad(placeLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ExploreScreen({ route }) {
  const navigation = useNavigation();
  const screenScrollRef = useRef(null);
  const mapFrameRef = useRef(null);
  const { places, cities, categories, refreshData } = useAppData();
  const { language } = useTranslation();

  const [showMapExpanded, setShowMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlacePreview, setShowPlacePreview] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedCityIds, setSelectedCityIds] = useState([]);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState('');
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const refreshKey = route?.params?.refreshKey;

  useEffect(() => {
    getUserLocation({ requestPermission: false });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshData?.();
    }, [refreshData])
  );

  const cityMap = useMemo(() => {
    return cities.filter(Boolean).reduce((acc, city) => {
      if (city?.id) {
        acc[city.id] = city;
      }
      return acc;
    }, {});
  }, [cities]);

  const categoryMap = useMemo(() => {
    return categories.filter(Boolean).reduce((acc, category) => {
      if (category?.id) {
        acc[category.id] = category;
      }
      return acc;
    }, {});
  }, [categories]);

  const getUserLocation = async ({ requestPermission = true } = {}) => {
    try {
      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationPermissionDenied(true);
        setUserLocation(null);
        setLocationErrorMessage(
          requestPermission
            ? 'Location permission is needed to show nearby places.'
            : ''
        );
        setShowLocationWarning(requestPermission);
        return null;
      }

      setLocationPermissionDenied(false);
      setLocationErrorMessage('');
      setShowLocationWarning(false);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(nextLocation);
      return nextLocation;
    } catch (error) {
      logWarning('Error getting user location:', error?.message);
      setUserLocation(null);
      setLocationErrorMessage('Your location is currently unavailable. Please try again.');
      setShowLocationWarning(requestPermission);
      return null;
    }
  };

  useEffect(() => {
    if (!refreshKey) {
      return;
    }

    setShowMapExpanded(false);
    setSelectedPlace(null);
    setShowPlacePreview(false);
    screenScrollRef.current?.scrollTo({ y: 0, animated: false });
    getUserLocation({ requestPermission: false });
  }, [refreshKey]);

  const visibleCities = useMemo(() => {
    return [...cities].sort((left, right) => {
      const leftPriority = getCityPriority(left);
      const rightPriority = getCityPriority(right);

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) return 1;
        if (rightPriority === -1) return -1;
        return leftPriority - rightPriority;
      }

      return getStableRandomScore(left) - getStableRandomScore(right);
    });
  }, [cities]);

  const getPlacesCount = (cityId) => {
    return places.filter((place) => place.cityId === cityId).length;
  };

  const handleCityPress = (cityId) => {
    navigation.navigate('CityPlaces', { cityId });
  };

  const placesWithCoordinates = useMemo(() => {
    return places.filter(
      (place) =>
        typeof place.latitude === 'number' &&
        typeof place.longitude === 'number'
    );
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const basePlaces = placesWithCoordinates.filter((place) => {
      if (
        selectedCategoryIds.length > 0 &&
        !idListIncludes(selectedCategoryIds, place.categoryId)
      ) {
        return false;
      }

      if (
        selectedCityIds.length > 0 &&
        !idListIncludes(selectedCityIds, place.cityId)
      ) {
        return false;
      }

      return true;
    });

    if (!nearbyOnly) {
      return basePlaces;
    }

    if (!userLocation) {
      return [];
    }

    return basePlaces.filter((place) => {
      const distance = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );

      return distance <= NEARBY_RADIUS_KM;
    });
  }, [
    nearbyOnly,
    placesWithCoordinates,
    selectedCategoryIds,
    selectedCityIds,
    userLocation,
  ]);

  const selectedFilterCategories = selectedCategoryIds
    .map((categoryId) => categoryMap[categoryId])
    .filter(Boolean);
  const selectedFilterCities = selectedCityIds
    .map((cityId) => cityMap[cityId])
    .filter(Boolean);
  const hasActiveFilters = Boolean(
    selectedCategoryIds.length > 0 ||
      selectedCityIds.length > 0 ||
      nearbyOnly
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];

    selectedFilterCategories.forEach((category) => {
      chips.push({
        key: `category-${category.id}`,
        label: `Category: ${category.name}`,
        onRemove: () =>
          setSelectedCategoryIds((currentIds) =>
            removeIdFromList(currentIds, category.id)
          ),
      });
    });

    selectedFilterCities.forEach((city) => {
      chips.push({
        key: `city-${city.id}`,
        label: `City: ${city.name}`,
        onRemove: () =>
          setSelectedCityIds((currentIds) =>
            removeIdFromList(currentIds, city.id)
          ),
      });
    });

    if (nearbyOnly) {
      chips.push({
        key: 'nearby',
        label: `Nearby: ${NEARBY_RADIUS_KM} km`,
        onRemove: () => setNearbyOnly(false),
      });
    }

    return chips;
  }, [nearbyOnly, selectedFilterCategories, selectedFilterCities]);

  const handleOpenMap = async () => {
    if (!userLocation) {
      await getUserLocation({ requestPermission: false });
    }

    setSelectedPlace(null);
    setShowPlacePreview(false);
    setShowMapExpanded(true);
  };

  const clearFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedCityIds([]);
    setNearbyOnly(false);
    setLocationErrorMessage('');
    setShowLocationWarning(false);
    setSelectedPlace(null);
    setShowPlacePreview(false);
  };

  const handleShowAllPlaces = () => {
    clearFilters();
    setShowFilterSheet(false);
  };

  const handleToggleNearby = async () => {
    if (nearbyOnly) {
      setNearbyOnly(false);
      setLocationErrorMessage('');
      setShowLocationWarning(false);
      return;
    }

    const nextLocation = userLocation || await getUserLocation({ requestPermission: true });

    if (!nextLocation) {
      setNearbyOnly(false);
      return;
    }

    setNearbyOnly(true);
    setLocationErrorMessage('');
    setShowLocationWarning(false);
  };

  const centerOnUserLocation = async () => {
    const nextLocation = userLocation || await getUserLocation({ requestPermission: true });

    if (!nextLocation) {
      return;
    }

    mapFrameRef.current?.contentWindow?.postMessage({
      type: 'DRITE_CENTER_USER_LOCATION',
      location: nextLocation,
    }, '*');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleMapMessage = (event) => {
      if (event?.data?.type !== 'DRITE_PLACE_PIN_CLICK') {
        return;
      }

      const place = filteredPlaces.find((item) =>
        idsMatch(item?.id, event.data.placeId)
      );

      if (!place) {
        return;
      }

      setSelectedPlace(place);
      setShowPlacePreview(true);
    };

    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [filteredPlaces]);

  const closePlacePreview = () => {
    setSelectedPlace(null);
    setShowPlacePreview(false);
  };

  const openPlaceDetailsFromPreview = () => {
    if (!selectedPlace) return;

    const placeId = selectedPlace?.id;
    if (!placeId) return;

    setShowMapExpanded(false);
    setShowPlacePreview(false);
    setSelectedPlace(null);

    setTimeout(() => {
      navigation.navigate('PlaceDetails', { placeId });
    }, 150);
  };

  const renderCityCard = (city) => {
    const placesCount = getPlacesCount(city?.id);

    return (
      <TouchableOpacity
        key={city?.id || city?.legacyId || city?.name}
        style={styles.cityCard}
        activeOpacity={0.88}
        onPress={() => handleCityPress(city?.id)}
      >
        <ImageBackground
          source={getImageSource(city.image)}
          style={styles.cityImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cityOverlay} />

          <View style={styles.cityContent}>
            <View style={styles.cityTextWrapper}>
              <Text style={styles.cityName}>{city.name}</Text>
              <Text style={styles.cityPlaces}>
                {placesCount} {placesCount === 1 ? 'place' : 'places'}
              </Text>
            </View>

            <View style={styles.cityArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const previewMapUrl =
    'https://www.google.com/maps?q=41.3275,19.8187&z=7&output=embed';

  const expandedMapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; overflow: hidden; }
          body { background: #f5f5f5; }
          .leaflet-control-attribution,
          .leaflet-control-container { display: none !important; }
          .place-pin {
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            background: #d51e1e;
            border: 3px solid #ffffff;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0,0,0,0.24);
          }
          .place-pin::after {
            content: "";
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ffffff;
            left: 7px;
            top: 7px;
          }
          .place-marker {
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translateY(-22px);
          }
          .place-marker.labels-hidden {
            transform: translateY(0);
          }
          .place-marker.labels-hidden .place-label {
            display: none;
          }
          .place-label {
            max-width: 132px;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.16);
            color: #222222;
            font: 800 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 5px 8px;
          }
          .user-pin {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2563EB;
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 8px rgba(37,99,235,0.18);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const markers = ${JSON.stringify(
            filteredPlaces.filter(Boolean).map((place) => ({
              latitude: place.latitude,
              longitude: place.longitude,
              name: place.name,
              id: place.id,
            }))
          )};
          const userLocation = ${JSON.stringify(userLocation)};
          const LABEL_MIN_ZOOM = 10;
          const map = L.map('map', {
            zoomControl: false,
            scrollWheelZoom: true,
            attributionControl: false
          }).setView([41.3275, 19.8187], 7);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

          const shouldShowLabels = () => map.getZoom() >= LABEL_MIN_ZOOM;

          const createPlaceIcon = (name, showLabel) => L.divIcon({
            className: '',
            html: '<div class="place-marker ' + (showLabel ? '' : 'labels-hidden') + '"><div class="place-label">' + escapeHtml(name) + '</div><div class="place-pin"></div></div>',
            iconSize: [150, 58],
            iconAnchor: showLabel ? [75, 58] : [75, 28]
          });
          const userIcon = L.divIcon({
            className: '',
            html: '<div class="user-pin"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          const placeLayers = markers.map((marker) => {
            const layer = L.marker([marker.latitude, marker.longitude], {
              icon: createPlaceIcon(marker.name, shouldShowLabels()),
              riseOnHover: true
            })
              .on('click', () => {
                window.parent.postMessage({
                  type: 'DRITE_PLACE_PIN_CLICK',
                  placeId: marker.id
                }, '*');
              })
              .addTo(map);

            layer.__placeName = marker.name;
            return layer;
          });

          const updateMarkerLabels = () => {
            const showLabel = shouldShowLabels();
            placeLayers.forEach((layer) => {
              layer.setIcon(createPlaceIcon(layer.__placeName, showLabel));
            });
          };

          map.on('zoomend', updateMarkerLabels);
          updateMarkerLabels();

          window.addEventListener('message', (event) => {
            if (event?.data?.type !== 'DRITE_CENTER_USER_LOCATION') {
              return;
            }

            const location = event.data.location;
            if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
              return;
            }

            map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 13), {
              animate: true
            });
          });

          if (userLocation) {
            L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
              .addTo(map);
          }

          const boundsPoints = markers.map((marker) => [marker.latitude, marker.longitude]);
          if (userLocation) {
            boundsPoints.push([userLocation.latitude, userLocation.longitude]);
          }

          if (boundsPoints.length > 0) {
            map.fitBounds(L.latLngBounds(boundsPoints), { padding: [48, 48], maxZoom: 13 });
          }
        </script>
      </body>
    </html>
  `;

  const selectedCity = selectedPlace ? cityMap[selectedPlace.cityId] : null;
  const selectedCategory = selectedPlace
    ? getCategoryLabel(selectedPlace.categoryId, selectedPlace.categoryName, language)
    : 'Place';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          ref={screenScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Explore</Text>

            <Ionicons name="map-outline" size={24} color="#222222" />
          </View>

          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.9}
            onPress={handleOpenMap}
          >
            <iframe
              title="Explore Albania Preview"
              src={previewMapUrl}
              style={styles.webIframe}
              loading="lazy"
              allowFullScreen
            />

            <View style={styles.heroGradientOverlay} />

            <View style={styles.mapTextOverlay}>
              <View style={styles.heroBadge}>
                <Ionicons name="map-outline" size={16} color={colors.white} />
                <Text style={styles.heroBadgeText}>Interactive Map</Text>
              </View>

              <Text style={styles.heroTitle}>Explore Albania</Text>
              <Text style={styles.heroText}>
                Discover cities, nearby spots and hidden gems on the map
              </Text>
            </View>
          </TouchableOpacity>

          <Modal
            visible={showMapExpanded}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setShowMapExpanded(false)}
          >
            <View style={styles.expandedMapContainer}>
              <iframe
                ref={mapFrameRef}
                title="Explore Albania Map"
                srcDoc={expandedMapHtml}
                style={styles.webIframeFull}
                loading="lazy"
                allowFullScreen
              />

              <SafeAreaView
                style={[styles.mapOverlaySafeArea, styles.boxNonePointerEvents]}
              >
                <View style={styles.mapHeaderFloating}>
                  <View style={styles.mapHeaderLeft}>
                    <View style={styles.mapFloatingPill}>
                      <Ionicons
                        name="compass-outline"
                        size={15}
                        color={colors.black}
                      />
                      <Text style={styles.mapFloatingPillText}>
                        {filteredPlaces.length} places
                      </Text>
                    </View>

                    {activeFilterChips.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.activeFiltersContent}
                        style={styles.activeFiltersRow}
                      >
                        {activeFilterChips.map((chip) => (
                          <Pressable
                            key={chip.key}
                            style={styles.activeFilterChip}
                            onPress={chip.onRemove}
                          >
                            <Text style={styles.activeFilterChipText} numberOfLines={1}>
                              {chip.label}
                            </Text>
                            <Ionicons name="close" size={14} color={colors.primary} />
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}

                    {showLocationWarning && (locationPermissionDenied || locationErrorMessage) && (
                      <View style={styles.mapWarningPill}>
                        <Ionicons
                          name="location-off-outline"
                          size={14}
                          color="#A15C00"
                        />
                        <Text style={styles.mapWarningPillText}>
                          {locationErrorMessage || 'Location permission unavailable.'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.mapActionsColumn}>
                    <Pressable
                      style={styles.floatingActionButton}
                      onPress={() => setShowMapExpanded(false)}
                    >
                      <Ionicons name="close" size={22} color={colors.black} />
                    </Pressable>

                    <Pressable
                      style={styles.floatingActionButton}
                      onPress={() => setShowFilterSheet(true)}
                    >
                      <Ionicons
                        name="options-outline"
                        size={20}
                        color={hasActiveFilters ? colors.primary : colors.black}
                      />
                    </Pressable>

                    <Pressable
                      style={styles.floatingActionButton}
                      onPress={centerOnUserLocation}
                    >
                      <Ionicons name="locate" size={20} color={colors.black} />
                    </Pressable>
                  </View>
                </View>

                {!showPlacePreview && (
                  <View style={styles.mapBottomOverlay}>
                    <View style={styles.mapInfoCard}>
                      <View style={styles.mapInfoTopRow}>
                        <View>
                          <Text style={styles.mapInfoTitle}>
                            {nearbyOnly ? 'Nearby places' : hasActiveFilters ? 'Filtered places' : 'All places'}
                          </Text>
                          <Text style={styles.mapInfoSubtext}>
                            {filteredPlaces.length > 0
                              ? 'Places are shown as pins on the map.'
                              : 'No places match these filters.'}
                          </Text>
                        </View>

                        <View style={styles.mapInfoCountBadge}>
                          <Text style={styles.mapInfoCountText}>
                            {filteredPlaces.length}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {showPlacePreview && selectedPlace && (
                  <View style={styles.placePreviewContainer}>
                    <View style={styles.placePreviewHandle} />

                    {selectedPlace.image && (
                      <Image
                        source={getImageSource(selectedPlace.image)}
                        style={styles.placePreviewImage}
                        resizeMode="cover"
                      />
                    )}

                    <View style={styles.placePreviewHeader}>
                      <View style={styles.placePreviewHeaderText}>
                        <Text style={styles.placePreviewTitle}>
                          {selectedPlace.name}
                        </Text>

                        <View style={styles.previewTagsRow}>
                          <View style={styles.previewTag}>
                            <Text style={styles.previewTagText}>
                              {selectedCategory}
                            </Text>
                          </View>

                          {selectedCity?.name && (
                            <View style={styles.previewTagSecondary}>
                              <Ionicons
                                name="location-outline"
                                size={13}
                                color="#555"
                              />
                              <Text style={styles.previewTagSecondaryText}>
                                {selectedCity.name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <Pressable
                        style={styles.placePreviewClose}
                        onPress={closePlacePreview}
                      >
                        <Ionicons name="close" size={20} color={colors.black} />
                      </Pressable>
                    </View>

                    <View style={styles.placePreviewMetaRow}>
                      <View style={styles.placePreviewRatingPill}>
                        <Ionicons name="star" size={15} color="#FFB400" />
                        <Text style={styles.placePreviewRating}>
                          {selectedPlace.rating ?? 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.placePreviewDescription}
                      numberOfLines={3}
                    >
                      {selectedPlace.description}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      style={styles.placePreviewButton}
                      onPress={openPlaceDetailsFromPreview}
                    >
                      <Text style={styles.placePreviewButtonText}>
                        Open place details
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                )}

              </SafeAreaView>

              <Modal
                visible={showFilterSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterSheet(false)}
              >
                <Pressable
                  style={styles.filterBackdrop}
                  onPress={() => setShowFilterSheet(false)}
                />

                <SafeAreaView edges={['bottom']} style={styles.filterSheetSafeArea}>
                  <View style={styles.filterSheet}>
                    <View style={styles.filterSheetHandle} />

                    <View style={styles.filterHeader}>
                      <View>
                        <Text style={styles.filterTitle}>Map filters</Text>
                        <Text style={styles.filterSubtitle}>
                          {filteredPlaces.length} places visible
                        </Text>
                      </View>

                      <Pressable
                        style={styles.filterCloseButton}
                        onPress={() => setShowFilterSheet(false)}
                      >
                        <Ionicons name="close" size={20} color={colors.black} />
                      </Pressable>
                    </View>

                    <View style={styles.placeModeToggle}>
                      <TouchableOpacity
                        style={[
                          styles.placeModeOption,
                          !nearbyOnly && styles.placeModeOptionActive,
                        ]}
                        activeOpacity={0.88}
                        onPress={handleShowAllPlaces}
                      >
                        <Ionicons
                          name="map-outline"
                          size={18}
                          color={!nearbyOnly ? colors.white : colors.primary}
                        />
                        <Text
                          style={[
                            styles.placeModeOptionText,
                            !nearbyOnly && styles.placeModeOptionTextActive,
                          ]}
                        >
                          All Places
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.placeModeOption,
                          nearbyOnly && styles.placeModeOptionActive,
                        ]}
                        activeOpacity={0.88}
                        onPress={handleToggleNearby}
                      >
                        <Ionicons
                          name="navigate-outline"
                          size={18}
                          color={nearbyOnly ? colors.white : colors.primary}
                        />
                        <Text
                          style={[
                            styles.placeModeOptionText,
                            nearbyOnly && styles.placeModeOptionTextActive,
                          ]}
                        >
                          Nearby 30 km
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      activeOpacity={0.88}
                      onPress={clearFilters}
                    >
                      <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                    </TouchableOpacity>

                    {showLocationWarning && locationErrorMessage ? (
                      <View style={styles.filterErrorBox}>
                        <Ionicons name="alert-circle-outline" size={16} color="#8A5A00" />
                        <Text style={styles.filterErrorText}>{locationErrorMessage}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.filterSectionTitle}>Category Filter</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filterOptionsRow}
                    >
                      {categories.filter(Boolean).map((category) => (
                        <TouchableOpacity
                          key={category?.id || category?.legacyId || category?.name}
                          style={[
                            styles.filterOptionChip,
                            idListIncludes(selectedCategoryIds, category.id) &&
                              styles.filterOptionChipActive,
                          ]}
                          activeOpacity={0.88}
                          onPress={() =>
                            setSelectedCategoryIds((currentIds) =>
                              toggleIdInList(currentIds, category.id)
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.filterOptionChipText,
                              idListIncludes(selectedCategoryIds, category.id) &&
                                styles.filterOptionChipTextActive,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.filterSectionTitle}>City Filter</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filterOptionsRow}
                    >
                      {visibleCities.filter(Boolean).map((city) => (
                        <TouchableOpacity
                          key={city?.id || city?.legacyId || city?.name}
                          style={[
                            styles.filterOptionChip,
                            idListIncludes(selectedCityIds, city.id) &&
                              styles.filterOptionChipActive,
                          ]}
                          activeOpacity={0.88}
                          onPress={() =>
                            setSelectedCityIds((currentIds) =>
                              toggleIdInList(currentIds, city.id)
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.filterOptionChipText,
                              idListIncludes(selectedCityIds, city.id) &&
                                styles.filterOptionChipTextActive,
                            ]}
                          >
                            {city.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </SafeAreaView>
              </Modal>
            </View>
          </Modal>

          <View style={styles.citiesSection}>
            {visibleCities.map(renderCityCard)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    elevation: 2,
  },

  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 22,
    height: 210,
    position: 'relative',
    backgroundColor: '#EDEDED',
  },

  webIframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },

  webIframeFull: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    flex: 1,
  },

  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },

  mapTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },

  heroBadgeText: {
    marginLeft: 6,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
    textShadow: '0 1px 4px rgba(0,0,0,0.35)',
  },

  heroText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
    maxWidth: '82%',
    textShadow: '0 1px 4px rgba(0,0,0,0.35)',
  },

  citiesSection: {
    gap: 16,
  },

  cityCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    boxShadow: '0 6px 14px rgba(0,0,0,0.05)',
    elevation: 3,
  },

  cityImage: {
    height: 185,
    justifyContent: 'flex-end',
  },

  cityImageStyle: {
    borderRadius: 22,
  },

  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  cityContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  cityTextWrapper: {
    flex: 1,
    marginRight: 12,
  },

  cityName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },

  cityPlaces: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  cityArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandedMapContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },

  mapOverlaySafeArea: {
    ...StyleSheet.absoluteFillObject,
  },

  boxNonePointerEvents: {
    pointerEvents: 'box-none',
  },

  mapHeaderFloating: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 30,
  },

  mapHeaderLeft: {
    flex: 1,
    paddingRight: 14,
  },

  mapFloatingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
    elevation: 5,
    marginBottom: 8,
  },

  mapFloatingPillText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },

  mapWarningPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,244,224,0.98)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  mapWarningPillText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#8A5A00',
  },

  activeFiltersRow: {
    maxWidth: '100%',
    marginBottom: 8,
  },

  activeFiltersContent: {
    gap: 8,
    paddingRight: 8,
  },

  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 210,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: 'rgba(213,30,30,0.18)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  activeFilterChipText: {
    marginRight: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  mapActionsColumn: {
    gap: 10,
  },

  floatingActionButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 14px rgba(0,0,0,0.12)',
    elevation: 8,
  },

  mapBottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 20,
  },

  mapInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    boxShadow: '0 8px 18px rgba(0,0,0,0.1)',
    elevation: 6,
  },

  mapInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  mapInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },

  mapInfoSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
  },

  mapInfoCountBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  mapInfoCountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
  },

  filterBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  filterSheetSafeArea: {
    backgroundColor: colors.white,
  },

  filterSheet: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  filterSheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 14,
  },

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  filterTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.black,
  },

  filterSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  filterCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },

  placeModeToggle: {
    flexDirection: 'row',
    gap: 8,
    padding: 5,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    marginBottom: 12,
  },

  placeModeOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  placeModeOptionActive: {
    backgroundColor: colors.primary,
  },

  placeModeOptionText: {
    marginLeft: 7,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  placeModeOptionTextActive: {
    color: colors.white,
  },

  clearFiltersButton: {
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    marginBottom: 10,
  },

  clearFiltersButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  filterErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  filterErrorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#8A5A00',
    fontWeight: '600',
  },

  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.black,
    marginTop: 10,
    marginBottom: 9,
  },

  filterOptionsRow: {
    gap: 9,
    paddingRight: 18,
    paddingBottom: 4,
  },

  filterOptionChip: {
    minHeight: 42,
    maxWidth: 190,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#E8E8E8',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  filterOptionChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FDECEC',
  },

  filterOptionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },

  filterOptionChipTextActive: {
    color: colors.primary,
  },

  placePreviewContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 86,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    boxShadow: '0 10px 18px rgba(0,0,0,0.14)',
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    zIndex: 25,
  },

  placePreviewHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 14,
  },

  placePreviewImage: {
    width: '100%',
    height: 145,
    borderRadius: 18,
    marginBottom: 14,
  },

  placePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  placePreviewHeaderText: {
    flex: 1,
  },

  placePreviewTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 8,
  },

  previewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  previewTag: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  previewTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },

  previewTagSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  previewTagSecondaryText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },

  placePreviewClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  placePreviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  placePreviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  placePreviewRating: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    marginLeft: 6,
  },

  placePreviewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  placePreviewButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#D62828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  placePreviewButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },

  webPlacesStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 104,
    zIndex: 24,
  },

  webPlacesStripContent: {
    paddingHorizontal: 16,
    gap: 10,
  },

  webPlaceChip: {
    minWidth: 150,
    maxWidth: 180,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
    elevation: 5,
  },

  webPlaceChipActive: {
    borderWidth: 1.5,
    borderColor: '#D62828',
  },

  webPlaceChipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },

  webPlaceChipSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});
