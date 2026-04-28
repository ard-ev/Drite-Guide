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
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import colors from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { getCategoryLabel, getImageSource } from '../utils/placeMeta';
import { useTranslation } from '../context/TranslationContext';

const FALLBACK_REGION = {
    latitude: 41.3275,
    longitude: 19.8187,
    latitudeDelta: 1.8,
    longitudeDelta: 1.8,
};

const ZOOM_LEVELS = {
    DOTS_ONLY: 1.2,
    PINS_ONLY: 0.32,
};

const CITY_PRIORITY = ['tirana', 'durres', 'vlore', 'gjirokaster'];

const normalizeCityKey = (value) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');

const getCitySortKey = (city) => normalizeCityKey(city.legacyId || city.id || city.name);

const getCityPriority = (city) => {
    const cityKeys = [city.legacyId, city.id, city.name, city.city_name].map(
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

export default function ExploreScreen({ route }) {
    const navigation = useNavigation();
    const screenScrollRef = useRef(null);
    const mapRef = useRef(null);
    const { places, cities } = useAppData();
    const { t, tc, language } = useTranslation();

    const [showMapExpanded, setShowMapExpanded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showPlacePreview, setShowPlacePreview] = useState(false);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [mapRegion, setMapRegion] = useState(FALLBACK_REGION);
    const refreshKey = route?.params?.refreshKey;

    useEffect(() => {
        getUserLocation();
    }, []);

    const cityMap = useMemo(() => {
        return cities.reduce((acc, city) => {
            acc[city.id] = city;
            return acc;
        }, {});
    }, [cities]);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationPermissionDenied(true);

                const fallbackLocation = {
                    latitude: 41.3275,
                    longitude: 19.8187,
                };

                setUserLocation(fallbackLocation);
                setMapRegion(FALLBACK_REGION);
                return;
            }

            setLocationPermissionDenied(false);

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const nextLocation = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setUserLocation(nextLocation);
            setMapRegion({
                latitude: nextLocation.latitude,
                longitude: nextLocation.longitude,
                latitudeDelta: 0.18,
                longitudeDelta: 0.18,
            });
        } catch (error) {
            console.log('Error getting user location:', error);

            const fallbackLocation = {
                latitude: 41.3275,
                longitude: 19.8187,
            };

            setUserLocation(fallbackLocation);
            setMapRegion(FALLBACK_REGION);
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
        getUserLocation();
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

    const idsMatch = (left, right) =>
        left === right || String(left) === String(right);

    const getPlacesCount = (cityId) => {
        return places.filter((place) => idsMatch(place.cityId, cityId)).length;
    };

    const handleCityPress = (cityId) => {
        navigation.navigate('CityPlaces', { cityId });
    };

    const handleOpenMap = async () => {
        if (!userLocation) {
            await getUserLocation();
        }

        setSelectedPlace(null);
        setShowPlacePreview(false);
        setShowMapExpanded(true);
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
    }, [places]);

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

            return distance <= 1200;
        });
    }, [userLocation, placesWithCoordinates]);

    const initialMapRegion = userLocation
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
        }
        : FALLBACK_REGION;

    const centerOnUserLocation = async () => {
        try {
            if (!userLocation) {
                await getUserLocation();
                return;
            }

            const targetRegion = {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.14,
                longitudeDelta: 0.14,
            };

            setMapRegion(targetRegion);

            if (mapRef.current) {
                mapRef.current.animateToRegion(targetRegion, 700);
            }
        } catch (error) {
            console.log('Error centering on location:', error);
        }
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

    const handleRegionChangeComplete = (region) => {
        setMapRegion(region);
    };

    const markerDisplayMode = useMemo(() => {
        const currentDelta = mapRegion?.latitudeDelta ?? FALLBACK_REGION.latitudeDelta;

        if (currentDelta > ZOOM_LEVELS.DOTS_ONLY) {
            return 'dots';
        }

        if (currentDelta > ZOOM_LEVELS.PINS_ONLY) {
            return 'pins';
        }

        return 'labels';
    }, [mapRegion]);

    const renderMarkerContent = (place) => {
        if (markerDisplayMode === 'dots') {
            return (
                <View style={styles.dotMarkerWrapper}>
                    <View style={styles.dotMarker} />
                </View>
            );
        }

        if (markerDisplayMode === 'pins') {
            return (
                <View style={styles.pinOnlyMarkerWrapper}>
                    <Ionicons name="location-sharp" size={34} color="#D62828" />
                </View>
            );
        }

        return (
            <View style={styles.customMarkerWrapper}>
                <View style={styles.customMarkerLabel}>
                    <Text
                        style={styles.customMarkerLabelText}
                        numberOfLines={1}
                    >
                        {place.name}
                    </Text>
                </View>

                <View style={styles.customMarkerPin}>
                    <Ionicons
                        name="location-sharp"
                        size={34}
                        color="#D62828"
                    />
                </View>
            </View>
        );
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
                                {tc('common.countPlaces', placesCount)}
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

    const previewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          body { background: #f5f5f5; }
          #map { width: 100%; height: 100%; }
          .leaflet-control-attribution,
          .leaflet-control-container {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false,
            touchZoom: false
          }).setView([41.3275, 19.8187], 7);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 19
          }).addTo(map);

          const markers = ${JSON.stringify(
              placesWithCoordinates.slice(0, 80).map((place) => ({
                  latitude: place.latitude,
                  longitude: place.longitude,
                  name: place.name,
              }))
          )};

          markers.forEach((marker) => {
            L.marker([marker.latitude, marker.longitude]).addTo(map);
          });

          if (markers.length > 0) {
            const bounds = L.latLngBounds(
              markers.map((marker) => [marker.latitude, marker.longitude])
            );
            map.fitBounds(bounds, { padding: [24, 24] });
          }
        </script>
      </body>
    </html>
  `;

    const selectedCity = selectedPlace ? cityMap[selectedPlace.cityId] : null;
    const selectedCategory = selectedPlace
        ? getCategoryLabel(selectedPlace.categoryId, selectedPlace.categoryName, language)
        : t('common.place');

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
                        <Text style={styles.title}>{t('explore.title')}</Text>

                        <Ionicons name="map-outline" size={24} color="#222222" />
                    </View>

                    <TouchableOpacity
                        style={styles.heroCard}
                        activeOpacity={0.9}
                        onPress={handleOpenMap}
                    >
                        <WebView
                            source={{ html: previewHtml }}
                            scrollEnabled={false}
                            overScrollMode="never"
                            style={styles.webViewMap}
                        />

                        <View style={styles.heroGradientOverlay} />
                        <View style={styles.mapTextOverlay}>
                            <View style={styles.heroBadge}>
                                <Ionicons
                                    name="map-outline"
                                    size={16}
                                    color={colors.white}
                                />
                                <Text style={styles.heroBadgeText}>{t('explore.interactiveMap')}</Text>
                            </View>

                            <Text style={styles.heroTitle}>{t('explore.heroTitle')}</Text>
                            <Text style={styles.heroText}>
                                {t('explore.heroText')}
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
                            <MapView
                                ref={mapRef}
                                style={styles.expandedMapView}
                                initialRegion={initialMapRegion}
                                showsUserLocation={true}
                                showsMyLocationButton={false}
                                showsCompass={false}
                                loadingEnabled={true}
                                onMapReady={centerOnUserLocation}
                                onRegionChangeComplete={handleRegionChangeComplete}
                                onPress={() => {
                                    if (showPlacePreview) {
                                        closePlacePreview();
                                    }
                                }}
                            >
                                {nearbyPlaces.map((place) => (
                                    <Marker
                                        key={place.id}
                                        coordinate={{
                                            latitude: place.latitude,
                                            longitude: place.longitude,
                                        }}
                                        anchor={{ x: 0.5, y: 1 }}
                                        tracksViewChanges={false}
                                        onPress={(e) => {
                                            e.stopPropagation?.();
                                            handleMarkerPress(place);
                                        }}
                                    >
                                        {renderMarkerContent(place)}
                                    </Marker>
                                ))}
                            </MapView>

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
                                                {t('common.countNearby', { count: nearbyPlaces.length })}
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
                                                    {t('explore.usingFallback')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.mapActionsColumn}>
                                        <Pressable
                                            style={styles.floatingActionButton}
                                            onPress={() => setShowMapExpanded(false)}
                                        >
                                            <Ionicons
                                                name="close"
                                                size={22}
                                                color={colors.black}
                                            />
                                        </Pressable>

                                        <Pressable
                                            style={styles.floatingActionButton}
                                            onPress={centerOnUserLocation}
                                        >
                                            <Ionicons
                                                name="locate"
                                                size={20}
                                                color={colors.black}
                                            />
                                        </Pressable>
                                    </View>
                                </View>

                                {!showPlacePreview && (
                                    <View style={styles.mapBottomOverlay}>
                                        <View style={styles.mapInfoCard}>
                                            <View style={styles.mapInfoTopRow}>
                                                <View>
                                                    <Text style={styles.mapInfoTitle}>
                                                        {t('explore.nearbyPlaces')}
                                                    </Text>
                                                    <Text style={styles.mapInfoSubtext}>
                                                        {t('explore.tapMarker')}
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
                                                            <Text
                                                                style={
                                                                    styles.previewTagSecondaryText
                                                                }
                                                            >
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
                                                <Ionicons
                                                    name="close"
                                                    size={20}
                                                    color={colors.black}
                                                />
                                            </Pressable>
                                        </View>

                                        <View style={styles.placePreviewMetaRow}>
                                            <View style={styles.placePreviewRatingPill}>
                                                <Ionicons
                                                    name="star"
                                                    size={15}
                                                    color="#FFB400"
                                                />
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
                                                {t('explore.openDetails')}
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

    webViewMap: {
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
    },

    expandedMapView: {
        flex: 1,
    },

    mapOverlaySafeArea: {
        ...StyleSheet.absoluteFillObject,
    },

    mapHeaderFloating: {
        position: 'absolute',
        top: 60,
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

    dotMarkerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    dotMarker: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#D62828',
        borderWidth: 2,
        borderColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },

    pinOnlyMarkerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    customMarkerWrapper: {
        alignItems: 'center',
    },

    customMarkerLabel: {
        backgroundColor: colors.white,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        marginBottom: -2,
        maxWidth: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },

    customMarkerLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.black,
        textAlign: 'center',
    },

    customMarkerPin: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    placePreviewContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
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
});
