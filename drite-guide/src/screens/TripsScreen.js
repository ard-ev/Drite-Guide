import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import CreateTripModal from '../components/CreateTripModal';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

export default function TripsScreen() {
  const navigation = useNavigation();
  const { isLoggedIn, getTrips, createTrip, refreshTrips, inviteUserToTrip } = useAuth();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const refreshTripsRef = useRef(refreshTrips);

  const trips = getTrips() || [];

  useEffect(() => {
    refreshTripsRef.current = refreshTrips;
  }, [refreshTrips]);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        refreshTripsRef.current?.();
      }
    }, [isLoggedIn])
  );

  const handleCreateTripPress = () => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Create an account or sign in to create trips.');
      return;
    }

    setCreateModalVisible(true);
  };

  const handleCreateModalClose = (createdTrip) => {
    setCreateModalVisible(false);

    if (createdTrip?.id) {
      navigation.navigate('TripDetails', { tripId: createdTrip.id });
    }
  };

  const handleInviteUsersAfterCreate = async (trip, usernames) => {
    const failedInvites = [];

    for (const username of usernames) {
      const result = await inviteUserToTrip(trip.id, username);

      if (!result.success) {
        failedInvites.push(`${username}: ${result.message || 'Invite failed'}`);
      }
    }

    if (failedInvites.length > 0) {
      return {
        success: false,
        message: failedInvites.join('\n'),
      };
    }

    return { success: true };
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.title}>Trips</Text>
            <TouchableOpacity style={styles.iconButton} onPress={handleCreateTripPress}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {!isLoggedIn ? (
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={52} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>Sign in to plan trips</Text>
              <Text style={styles.emptySubtitle}>
                Trips are saved to your account and can be shared with invited users.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          ) : trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={52} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a trip, add places, plan visit times, and invite friends.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.88}
                onPress={handleCreateTripPress}
              >
                <Text style={styles.primaryButtonText}>Create Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.createTripCard}
                activeOpacity={0.88}
                onPress={handleCreateTripPress}
              >
                <View style={styles.createTripIcon}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.tripContent}>
                  <Text style={styles.createTripTitle}>Create Trip</Text>
                  <Text style={styles.tripSubtitle}>Start a new plan with dates, notes, places, and invited users.</Text>
                </View>
              </TouchableOpacity>

              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
                >
                  <View style={styles.tripIcon}>
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                  </View>

                  <View style={styles.tripContent}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <Text style={styles.tripSubtitle} numberOfLines={2}>
                      {trip.description || 'No description added yet.'}
                    </Text>
                    <Text style={styles.tripDateRange}>
                      {trip.start_date} - {trip.end_date}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Ionicons name="location-outline" size={14} color={colors.primary} />
                        <Text style={styles.metaText}>{trip.placesCount || 0} places</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Ionicons name="people-outline" size={14} color={colors.primary} />
                        <Text style={styles.metaText}>{trip.invitedUsersCount || 0} invited</Text>
                      </View>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <CreateTripModal
          visible={createModalVisible}
          onClose={handleCreateModalClose}
          onSave={createTrip}
          onInviteUsersAfterCreate={handleInviteUsersAfterCreate}
        />
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
    color: '#222222',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  createTripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  createTripIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createTripTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  tripIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripContent: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },
  tripSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  tripDateRange: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
});
