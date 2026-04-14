import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function SavedScreen() {
  const { currentUser, isLoggedIn, getSavedPlaces, removeSavedPlace } = useAuth();

  const savedPlaces = getSavedPlaces() || [];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Saved</Text>
            <Ionicons name="bookmark-outline" size={24} color="#222222" />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {isLoggedIn ? 'Your saved places' : 'Saved on this device'}
            </Text>

            <Text style={styles.infoSubtitle}>
              {isLoggedIn
                ? `You are logged in as @${currentUser?.username}.`
                : 'You can save places without an account. Later you can sign up to sync them.'}
            </Text>
          </View>

          {savedPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={54} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>No saved places yet</Text>
              <Text style={styles.emptySubtitle}>
                Saved places will appear here once the user bookmarks a location.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved places</Text>

              {savedPlaces.map((place) => (
                <View key={place.id} style={styles.placeCard}>
                  <View style={styles.placeLeft}>
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#222222"
                      />
                    </View>

                    <View style={styles.textWrap}>
                      <Text style={styles.placeName}>
                        {place.name || 'Unnamed place'}
                      </Text>
                      <Text style={styles.placeMeta}>
                        {place.city || 'Unknown city'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => removeSavedPlace(place.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
    color: '#222222',
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  infoSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginTop: 14,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },

  section: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },

  placeCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  placeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  textWrap: {
    flex: 1,
  },

  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  placeMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
});