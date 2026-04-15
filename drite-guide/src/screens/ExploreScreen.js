import React, { useMemo } from 'react';
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

          <View style={styles.heroCard}>
            <Ionicons name="map-outline" size={46} color={colors.primary} />
            <Text style={styles.heroTitle}>Explore Albania</Text>
            <Text style={styles.heroText}>
              Choose a city and browse its best places
            </Text>
          </View>

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
    backgroundColor: colors.primary + '15',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    marginBottom: 22,
    alignItems: 'center',
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 6,
  },

  heroText: {
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