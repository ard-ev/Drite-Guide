import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleCategoryPress = (categoryId) => {
    navigation.navigate('Explore', {
      cityId: 'tirana',
      categoryId,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>Dritë Guide</Text>
                <Text style={styles.brandSubtitle}>
                  Discover Albania with ease
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities, restaurants, cafés, bars..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Find the best places in Albania</Text>
            <Text style={styles.heroText}>
              Explore cities, villages, restaurants, cafés, bars, clubs and
              hidden gems in one clean and familiar experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular categories</Text>

            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('restaurants')}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>🍽️</Text>
                <Text style={styles.categoryTitle}>Restaurants</Text>
                <Text style={styles.categorySubtitle}>Top-rated places</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('cafes')}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>☕</Text>
                <Text style={styles.categoryTitle}>Cafés</Text>
                <Text style={styles.categorySubtitle}>Relaxed spots</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('bars')}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>🍸</Text>
                <Text style={styles.categoryTitle}>Bars</Text>
                <Text style={styles.categorySubtitle}>Drinks and nightlife</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('hotels')}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>🏨</Text>
                <Text style={styles.categoryTitle}>Hotels</Text>
                <Text style={styles.categorySubtitle}>Stay in comfort</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested places</Text>

            <TouchableOpacity style={styles.placeCard} activeOpacity={0.9}>
              <View style={styles.placeImagePlaceholder} />
              <View style={styles.placeContent}>
                <View style={styles.placeTopRow}>
                  <Text style={styles.placeCategory}>Restaurant</Text>
                  <Text style={styles.placeRating}>★ 4.9</Text>
                </View>
                <Text style={styles.placeTitle}>Mullixhiu</Text>
                <Text style={styles.placeLocation}>Tirana, Albania</Text>
                <Text style={styles.placeDescription}>
                  A refined Albanian restaurant with local ingredients and a
                  modern culinary identity.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.placeCard} activeOpacity={0.9}>
              <View style={styles.placeImagePlaceholder} />
              <View style={styles.placeContent}>
                <View style={styles.placeTopRow}>
                  <Text style={styles.placeCategory}>Bar</Text>
                  <Text style={styles.placeRating}>★ 4.8</Text>
                </View>
                <Text style={styles.placeTitle}>Radio Bar</Text>
                <Text style={styles.placeLocation}>Tirana, Albania</Text>
                <Text style={styles.placeDescription}>
                  A stylish cocktail bar with character, music and a strong
                  local nightlife atmosphere.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF385C',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    backgroundColor: '#FF385C',
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#FFD6DE',
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    marginTop: -10,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
  },
  searchButton: {
    backgroundColor: colors?.primary || '#FF385C',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginTop: 22,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
    lineHeight: 34,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6B7280',
  },

  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 14,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  placeImagePlaceholder: {
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  placeContent: {
    padding: 16,
  },
  placeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  placeCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  placeRating: {
    fontSize: 13,
    color: '#222222',
    fontWeight: '700',
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  placeLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  placeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
});