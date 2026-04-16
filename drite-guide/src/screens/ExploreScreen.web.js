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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function ExploreScreen() {
  const navigation = useNavigation();

  const [showMapExpanded, setShowMapExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
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

      return distance <= 20;
    });
  }, [userLocation, placesWithCoordinates]);

  const handleOpenMap = async () => {
    if (!userLocation) {
      await getUserLocation();
    }
    setShowMapExpanded(true);
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

  const previewMapUrl = 'https://www.google.com/maps?q=41.3275,19.8187&z=11&output=embed';

  const expandedMapUrl = userLocation
    ? `https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}&z=12&output=embed`
    : 'https://www.google.com/maps?q=41.3275,19.8187&z=8&output=embed';

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
            <SafeAreaView style={styles.expandedMapContainer} edges={['top']}>
              <iframe
                title="Explore Albania Map"
                src={expandedMapUrl}
                style={styles.webIframeFull}
                loading="lazy"
                allowFullScreen
              />

              <View style={styles.mapTopOverlay}>
                <Pressable
                  style={styles.floatingCloseButton}
                  onPress={() => setShowMapExpanded(false)}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </Pressable>

                <Pressable
                  style={styles.floatingLocationButton}
                  onPress={() => {
                    window.open(expandedMapUrl, '_blank');
                  }}
                >
                  <Ionicons name="locate" size={20} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.mapInfoCard}>
                <View style={styles.mapInfoRow}>
                  <Ionicons name="location" size={16} color={colors.black} />
                  <Text style={styles.mapInfoText}>
                    {nearbyPlaces.length} nearby {nearbyPlaces.length === 1 ? 'place' : 'places'}
                  </Text>
                </View>

                <Text style={styles.mapInfoSubtext}>
                  Showing your current area on web. Nearby places are counted from your saved data.
                </Text>
              </View>
            </SafeAreaView>
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
    backgroundColor: colors.black,
  },

  expandedMapContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  expandedMapView: {
    flex: 1,
  },

  mapTopOverlay: {
    position: 'absolute',
    top: 58,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },

  floatingCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  floatingLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B2C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  mapInfoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
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

  webIframeFull: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    flex: 1,
  },

  mapInfoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
});