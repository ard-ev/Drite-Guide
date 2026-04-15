import React, { useMemo, useState } from 'react';
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
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [showMapExpanded, setShowMapExpanded] = useState(false);

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

  const visibleCities = useMemo(() => {
    return cities.filter((city) => allowedCityIds.includes(city.id));
  }, []);

  const getPlacesCount = (cityId) => {
    return places.filter((place) => place.cityId === cityId).length;
  };

  const handleCityPress = (cityId) => {
    navigation.navigate('CityPlaces', { cityId });
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
            onPress={() => setShowMapExpanded(true)}
          >
            <WebView
              source={{
                html: `
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
                        const map = L.map('map').setView([41.3275, 19.8187], 12);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                          attribution: '',
                          maxZoom: 19
                        }).addTo(map);
                        L.marker([41.3275, 19.8187]).addTo(map)
                          .bindPopup('<b>Tirana</b><br>Capital of Albania');
                      </script>
                    </body>
                  </html>
                `,
              }}
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

          {/* Expanded Map Modal */}
          <Modal
            visible={showMapExpanded}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setShowMapExpanded(false)}
          >
            <SafeAreaView style={styles.expandedMapContainer} edges={['top']}>
              <View style={styles.expandedMapHeader}>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setShowMapExpanded(false)}
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color={colors.white}
                  />
                </Pressable>
                <Text style={styles.expandedTitle}>
                  Map of Albania
                </Text>
                <View style={{ width: 40 }} />
              </View>

              <WebView
                source={{
                  html: `
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
                          const map = L.map('map').setView([41.1533, 20.1683], 7);
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '',
                            maxZoom: 19
                          }).addTo(map);

                          const cities = [
                            {lat: 41.3275, lng: 19.8187, name: 'Tirana', type: 'capital'},
                            {lat: 41.5183, lng: 19.5534, name: 'Durrës', type: 'city'},
                            {lat: 42.0694, lng: 19.5086, name: 'Shkodër', type: 'city'},
                            {lat: 40.4636, lng: 19.4944, name: 'Vlorë', type: 'city'},
                            {lat: 39.8671, lng: 20.1546, name: 'Saranda', type: 'city'},
                            {lat: 39.7667, lng: 20.75, name: 'Ksamil', type: 'city'},
                            {lat: 40.3261, lng: 19.8295, name: 'Dhermi', type: 'city'},
                            {lat: 40.0997, lng: 20.2583, name: 'Gjirokastër', type: 'city'},
                            {lat: 41.1275, lng: 20.5969, name: 'Korça', type: 'city'},
                            {lat: 40.7167, lng: 19.2667, name: 'Berat', type: 'city'},
                            {lat: 41.8197, lng: 19.2789, name: 'Lezhë', type: 'city'},
                            {lat: 41.8494, lng: 19.9906, name: 'Theth', type: 'city'}
                          ];

                          cities.forEach(city => {
                            const color = city.type === 'capital' ? '#FF3B30' : '#FF9500';
                            L.circleMarker([city.lat, city.lng], {
                              radius: city.type === 'capital' ? 8 : 6,
                              fillColor: color,
                              color: '#fff',
                              weight: 2,
                              opacity: 1,
                              fillOpacity: 0.8
                            }).addTo(map).bindPopup('<b>' + city.name + '</b>');
                          });
                        </script>
                      </body>
                    </html>
                  `,
                }}
                style={styles.expandedMapView}
              />
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

  heroCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flex: 1,
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

  expandedMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },

  expandedMapView: {
    flex: 1,
  },
});