import React, { useEffect, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

const FALLBACK_LOCATION = {
  latitude: 41.3275,
  longitude: 19.8187,
};

export default function ExploreScreen() {
  const navigation = useNavigation();

  const [showMapExpanded, setShowMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlacePreview, setShowPlacePreview] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const allowedCityIds = [
    'tirana',
    'durres',
    'shkoder',
    'vlore',
    'ksamil',
    'dhermi',
    'lin',
    'theth',
    'gjirokaster',
    'korca',
    'berat',
    'lezhe',
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  const cityMap = useMemo(() => {
    return cities.reduce((acc, city) => {
      acc[city.id] = city;
      return acc;
    }, {});
  }, []);

  const formatCategory = (categoryId) => {
    if (!categoryId) return 'Place';

    return categoryId
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        setUserLocation(FALLBACK_LOCATION);
        return;
      }

      setLocationPermissionDenied(false);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Error getting user location:', error);
      setUserLocation(FALLBACK_LOCATION);
    }
  };

  const visibleCities = useMemo(() => {
    return cities.filter((city) => allowedCityIds.includes(city.id));
  }, []);

  const getPlacesCount = (cityId) => {
    return places.filter((place) => place.cityId === cityId).length;
  };

  const handleCityPress = (cityId) => {
    navigation.navigate('CityPlaces', { cityId });
  };

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const placesWithCoordinates = useMemo(() => {
    return places.filter(
      (place) =>
        typeof place.latitude === 'number' &&
        typeof place.longitude === 'number'
    );
  }, []);

  const nearbyPlaces = useMemo(() => {
    if (!userLocation) {
      return placesWithCoordinates;
    }

    return placesWithCoordinates.filter((place) => {
      const distance = getDistanceInKm(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );

      return distance <= 100;
    });
  }, [userLocation, placesWithCoordinates]);

  const handleOpenMap = async () => {
    if (!userLocation) {
      await getUserLocation();
    }

    setSelectedPlace(null);
    setShowPlacePreview(false);
    setShowMapExpanded(true);
  };

  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
    setShowPlacePreview(true);
  };

  const closePlacePreview = () => {
    setSelectedPlace(null);
    setShowPlacePreview(false);
  };

  const openPlaceDetailsFromPreview = () => {
    if (!selectedPlace) return;

    const placeId = selectedPlace.id;

    setShowMapExpanded(false);
    setShowPlacePreview(false);
    setSelectedPlace(null);

    setTimeout(() => {
      navigation.navigate('PlaceDetails', { placeId });
    }, 150);
  };

  const renderCityCard = (city) => {
    const placesCount = getPlacesCount(city.id);

    return (
      <TouchableOpacity
        key={city.id}
        style={styles.cityCard}
        activeOpacity={0.88}
        onPress={() => handleCityPress(city.id)}
      >
        <ImageBackground
          source={city.image}
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

  const expandedMapUrl = userLocation
    ? `https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}&z=11&output=embed`
    : 'https://www.google.com/maps?q=41.3275,19.8187&z=8&output=embed';

  const externalMapUrl = userLocation
    ? `https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`
    : 'https://www.google.com/maps?q=41.3275,19.8187';

  const selectedCity = selectedPlace ? cityMap[selectedPlace.cityId] : null;
  const selectedCategory = selectedPlace
    ? formatCategory(selectedPlace.categoryId)
    : 'Place';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Explore</Text>

            <View style={styles.headerIcon}>
              <Ionicons name="map-outline" size={22} color={colors.black} />
            </View>
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
                title="Explore Albania Map"
                src={expandedMapUrl}
                style={styles.webIframeFull}
                loading="lazy"
                allowFullScreen
              />

              <SafeAreaView
                pointerEvents="box-none"
                style={styles.mapOverlaySafeArea}
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
                        {nearbyPlaces.length} nearby
                      </Text>
                    </View>

                    {locationPermissionDenied && (
                      <View style={styles.mapWarningPill}>
                        <Ionicons
                          name="location-off-outline"
                          size={14}
                          color="#A15C00"
                        />
                        <Text style={styles.mapWarningPillText}>
                          Using fallback location
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
                      onPress={() => window.open(externalMapUrl, '_blank')}
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
                          <Text style={styles.mapInfoTitle}>Nearby places</Text>
                          <Text style={styles.mapInfoSubtext}>
                            Click a place below to preview its details.
                          </Text>
                        </View>

                        <View style={styles.mapInfoCountBadge}>
                          <Text style={styles.mapInfoCountText}>
                            {nearbyPlaces.length}
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
                        source={selectedPlace.image}
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

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.webPlacesStripContent}
                  style={styles.webPlacesStrip}
                >
                  {nearbyPlaces.map((place) => {
                    const city = cityMap[place.cityId];

                    return (
                      <TouchableOpacity
                        key={place.id}
                        style={[
                          styles.webPlaceChip,
                          selectedPlace?.id === place.id && styles.webPlaceChipActive,
                        ]}
                        activeOpacity={0.88}
                        onPress={() => handleMarkerPress(place)}
                      >
                        <Text
                          style={styles.webPlaceChipTitle}
                          numberOfLines={1}
                        >
                          {place.name}
                        </Text>
                        <Text
                          style={styles.webPlaceChipSubtitle}
                          numberOfLines={1}
                        >
                          {city?.name || 'Unknown city'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </SafeAreaView>
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  heroText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
    maxWidth: '82%',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  citiesSection: {
    gap: 16,
  },

  cityCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
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
    bottom: 16,
    zIndex: 15,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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