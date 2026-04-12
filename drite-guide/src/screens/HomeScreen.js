import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('SearchResults', {
        query: searchQuery,
      });
    }
  };

  const categories = [
    { id: 'restaurants', label: 'Restaurants', emoji: '🍽️', subtitle: 'Top-rated places' },
    { id: 'cafes', label: 'Cafés', emoji: '☕', subtitle: 'Relaxed spots' },
    { id: 'bars', label: 'Bars', emoji: '🍸', subtitle: 'Drinks & nightlife' },
    { id: 'hotels', label: 'Hotels', emoji: '🏨', subtitle: 'Stay in comfort' },
    { id: 'beaches', label: 'Beaches', emoji: '🏖️', subtitle: 'Scenic views' },
    { id: 'mosques', label: 'Mosques', emoji: '🕌', subtitle: 'Religious sites' },
    { id: 'churches', label: 'Churches', emoji: '⛪', subtitle: 'Historical' },
    { id: 'historical', label: 'Historical Sites', emoji: '📚', subtitle: 'Ancient places' },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>Dritë Guide</Text>
              <Text style={styles.brandSubtitle}>Discover Albania with ease</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities, restaurants, cafés, bars..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.85}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Find the best places in Albania</Text>
          <Text style={styles.heroText}>
            Explore Cities, Villages, Restaurants, Cafés, Bars, Clubs and Hidden
            Gems in one clean experience.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular categories</Text>

          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() => {
                  navigation.navigate('SearchResults', {
                    query: category.label,
                  });
                }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryTitle}>{category.label}</Text>
                <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(244, 244, 244, 0.9)'
  },

  safeArea: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.00,
    shadowRadius: 8,
    elevation: 6,
  },

  headerContent: {
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },

  brandRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  brandTextWrap: {
    alignItems: 'center',
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  brandSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: '#FAD4D4',
    textAlign: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  scrollContent: {
    paddingBottom: 120,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    marginTop: 14,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
  },

  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
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
});