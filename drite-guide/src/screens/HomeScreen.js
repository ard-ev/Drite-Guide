import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import colors from '../theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
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
              <View>
                <Text style={styles.brandTitle}>Dritë Guide</Text>
                <Text style={styles.brandSubtitle}>Discover Albania with ease</Text>
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
              Explore cities, villages, restaurants, cafés, bars, clubs and hidden
              gems in one clean and familiar experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular categories</Text>

            <View style={styles.categoryGrid}>
              <TouchableOpacity style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>🍽️</Text>
                <Text style={styles.categoryTitle}>Restaurants</Text>
                <Text style={styles.categorySubtitle}>Top-rated places</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>☕</Text>
                <Text style={styles.categoryTitle}>Cafés</Text>
                <Text style={styles.categorySubtitle}>Relaxed spots</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>🍸</Text>
                <Text style={styles.categoryTitle}>Bars</Text>
                <Text style={styles.categorySubtitle}>Drinks and nightlife</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>🏨</Text>
                <Text style={styles.categoryTitle}>Hotels</Text>
                <Text style={styles.categorySubtitle}>Stay in comfort</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested places</Text>

            <TouchableOpacity style={styles.placeCard}>
              <View style={styles.placeImagePlaceholder} />
              <View style={styles.placeContent}>
                <View style={styles.placeTopRow}>
                  <Text style={styles.placeCategory}>Restaurant</Text>
                  <Text style={styles.placeRating}>★ 4.9</Text>
                </View>
                <Text style={styles.placeTitle}>Mullixhiu</Text>
                <Text style={styles.placeLocation}>Tirana, Albania</Text>
                <Text style={styles.placeDescription}>
                  A refined local dining experience with authentic Albanian character.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.placeCard}>
              <View style={styles.placeImagePlaceholder} />
              <View style={styles.placeContent}>
                <View style={styles.placeTopRow}>
                  <Text style={styles.placeCategory}>Café</Text>
                  <Text style={styles.placeRating}>★ 4.8</Text>
                </View>
                <Text style={styles.placeTitle}>Komiteti Café Museum</Text>
                <Text style={styles.placeLocation}>Tirana, Albania</Text>
                <Text style={styles.placeDescription}>
                  A well-known place for coffee, atmosphere and a memorable local vibe.
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
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#6B7280',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    marginBottom: 22,
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
    paddingHorizontal: 18,
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
    marginBottom: 24,
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
    lineHeight: 22,
    color: '#6B7280',
  },
  section: {
    marginBottom: 26,
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