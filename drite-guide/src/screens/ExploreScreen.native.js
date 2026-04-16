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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function ExploreScreen() {
    const navigation = useNavigation();
    const mapRef = useRef(null);

    const [showMapExpanded, setShowMapExpanded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showPlacePreview, setShowPlacePreview] = useState(false);

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

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Test location: Tirana
            setUserLocation({
                latitude: 41.3275,
                longitude: 19.8187,
            });
        } catch (error) {
            console.log('Error getting user location:', error);
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

    const initialMapRegion = userLocation
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
        }
        : {
            latitude: 41.3275,
            longitude: 19.8187,
            latitudeDelta: 1.8,
            longitudeDelta: 1.8,
        };

    const centerOnUserLocation = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.12,
                    longitudeDelta: 0.12,
                },
                800
            );
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

    const previewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          body { height: 100vh; }
          #map { width: 100%; height: 100%; }
          .leaflet-control-attribution { display: none !important; }
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
          }).setView([41.3275, 19.8187], 12);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 19
          }).addTo(map);

          L.marker([41.3275, 19.8187]).addTo(map)
            .bindPopup('<b>Tirana</b><br>Capital of Albania');
        </script>
      </body>
    </html>
  `;

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
                        <WebView
                            source={{ html: previewHtml }}
                            scrollEnabled={false}
                            overScrollMode="never"
                            style={styles.webViewMap}
                        />

                        <View style={styles.mapTextOverlay}>
                            <Ionicons
                                name="map-outline"
                                size={46}
                                color={colors.white}
                                style={styles.heroIcon}
                            />
                            <Text style={styles.heroTitle}>Explore Albania</Text>
                            <Text style={styles.heroText}>
                                Tap to view the interactive map
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
                                showsCompass={true}
                                loadingEnabled={true}
                                onMapReady={centerOnUserLocation}
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
                                        onPress={(e) => {
                                            e.stopPropagation?.();
                                            handleMarkerPress(place);
                                        }}
                                    >
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
                                    </Marker>
                                ))}
                            </MapView>

                            <SafeAreaView
                                pointerEvents="box-none"
                                style={styles.mapOverlaySafeArea}
                            >
                                <View style={styles.mapTopOverlay}>
                                    <Pressable
                                        style={styles.floatingCloseButton}
                                        onPress={() => setShowMapExpanded(false)}
                                    >
                                        <Ionicons name="close" size={24} color={colors.white} />
                                    </Pressable>

                                    <Pressable
                                        style={styles.floatingLocationButton}
                                        onPress={centerOnUserLocation}
                                    >
                                        <Ionicons name="locate" size={20} color={colors.white} />
                                    </Pressable>
                                </View>

                                {!showPlacePreview && (
                                    <View style={styles.mapBottomOverlay}>
                                        <View style={styles.mapInfoCard}>
                                            <View style={styles.mapInfoRow}>
                                                <Ionicons
                                                    name="location"
                                                    size={16}
                                                    color={colors.black}
                                                />
                                                <Text style={styles.mapInfoText}>
                                                    {nearbyPlaces.length} nearby{' '}
                                                    {nearbyPlaces.length === 1 ? 'place' : 'places'}
                                                </Text>
                                            </View>

                                            <Text style={styles.mapInfoSubtext}>
                                                Tap a marker to preview a place.
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {showPlacePreview && selectedPlace && (
                                    <View style={styles.placePreviewContainer}>
                                        <View style={styles.placePreviewHandle} />

                                        <View style={styles.placePreviewHeader}>
                                            <View style={styles.placePreviewHeaderText}>
                                                <Text style={styles.placePreviewTitle}>
                                                    {selectedPlace.name}
                                                </Text>
                                                <Text style={styles.placePreviewCategory}>
                                                    {selectedPlace.categoryId}
                                                </Text>
                                            </View>

                                            <Pressable
                                                style={styles.placePreviewClose}
                                                onPress={closePlacePreview}
                                            >
                                                <Ionicons name="close" size={20} color={colors.black} />
                                            </Pressable>
                                        </View>

                                        <View style={styles.placePreviewMetaRow}>
                                            <Ionicons name="star" size={16} color="#FFB400" />
                                            <Text style={styles.placePreviewRating}>
                                                {selectedPlace.rating ?? 'N/A'}
                                            </Text>
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
                                                Tap to open details
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
        height: 200,
        position: 'relative',
    },

    webViewMap: {
        flex: 1,
    },

    mapTextOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    heroIcon: {
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.white,
        marginTop: 8,
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    heroText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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

    mapTopOverlay: {
        position: 'absolute',
        top: 54,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    floatingCloseButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#D62828',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.18)',
    },

    floatingLocationButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF6B2C',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.18)',
    },

    mapBottomOverlay: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
    },

    mapInfoCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 6,
    },

    mapInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },

    mapInfoText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.black,
        marginLeft: 8,
    },

    mapInfoSubtext: {
        fontSize: 13,
        lineHeight: 18,
        color: '#666',
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
        borderRadius: 24,
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

    placePreviewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },

    placePreviewHeaderText: {
        flex: 1,
    },

    placePreviewTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        marginBottom: 4,
    },

    placePreviewCategory: {
        fontSize: 13,
        color: '#777',
        textTransform: 'capitalize',
    },

    placePreviewClose: {
        width: 34,
        height: 34,
        borderRadius: 17,
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

    placePreviewRating: {
        fontSize: 14,
        fontWeight: '600',
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
        height: 50,
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