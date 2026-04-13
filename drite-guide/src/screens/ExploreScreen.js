import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function ExploreScreen() {
  const navigation = useNavigation();

  const handleCityPress = (cityId) => {
    navigation.navigate('Explore', {
      cityId,
    });
  };

  const getPlacesCount = (cityId) => {
    return places.filter((place) => place.cityId === cityId).length;
  };

  const renderCityCard = (city) => {
    const placesCount = getPlacesCount(city.id);

    return (
      <TouchableOpacity
        key={city.id}
        style={styles.cityCard}
        onPress={() => handleCityPress(city.id)}
        activeOpacity={0.88}
      >
        <ImageBackground
          source={city.image}
          style={styles.cityImage}
          imageStyle={styles.cityImageStyle}
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
            <Ionicons name="map-outline" size={24} color={colors.black} />
          </View>

          <View style={styles.mapAdvert}>
            <Ionicons name="map" size={48} color={colors.primary} />
            <Text style={styles.advertTitle}>Explore Albania</Text>
            <Text style={styles.advertSubtext}>
              Browse all cities and their attractions below
            </Text>
          </View>

          <View style={styles.citiesSection}>
            {cities.map(renderCityCard)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.gray,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.gray,
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

  mapAdvert: {
    backgroundColor: colors.primary + '15',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    marginBottom: 22,
    alignItems: 'center',
  },

  advertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 6,
  },

  advertSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
});