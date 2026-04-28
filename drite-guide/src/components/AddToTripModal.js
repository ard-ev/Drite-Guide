import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import CreateTripModal from './CreateTripModal';
import TripPlaceScheduleModal from './TripPlaceScheduleModal';

export default function AddToTripModal({ visible, place, onClose, onAdded }) {
  const { getTrips, getTrip, createTrip, addPlaceToTrip } = useAuth();
  const backendPlaceId = place?.seededId || place?.id;
  const trips = (getTrips() || []).filter((trip) => trip?.id);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [checkingTripId, setCheckingTripId] = useState(null);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [createTripVisible, setCreateTripVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedTrip(null);
      setCheckingTripId(null);
      setScheduleVisible(false);
      setCreateTripVisible(false);
    }
  }, [visible]);

  const tripHasPlace = (trip) => {
    if (!backendPlaceId) {
      return false;
    }

    return (trip?.places || []).filter(Boolean).some((tripPlace) => {
      const tripPlaceId = tripPlace?.placeId || tripPlace?.place_id;
      return String(tripPlaceId) === String(backendPlaceId);
    });
  };

  const handleTripPress = async (trip) => {
    if (!trip?.id) {
      return;
    }

    setCheckingTripId(trip.id);
    const result = await getTrip(trip.id);
    setCheckingTripId(null);

    if (!result.success) {
      Alert.alert('Trip unavailable', result.message || 'This trip could not be loaded.');
      return;
    }

    if (tripHasPlace(result.trip)) {
      Alert.alert('Place already exists in this trip', 'Choose a different trip or edit it from Trip Details.');
      return;
    }

    setSelectedTrip(result.trip);
    setScheduleVisible(true);
  };

  const handleCreateTripClose = (createdTrip) => {
    setCreateTripVisible(false);

    if (createdTrip?.id) {
      setSelectedTrip(createdTrip);
      setScheduleVisible(true);
    }
  };

  const handleSaveVisit = async (visitPayload) => {
    if (!selectedTrip?.id || !backendPlaceId) {
      return {
        success: false,
        message: 'This place or trip could not be loaded.',
      };
    }

    const result = await addPlaceToTrip(selectedTrip.id, {
      place_id: backendPlaceId,
      ...visitPayload,
    });

    if (result.success) {
      setScheduleVisible(false);
      onAdded?.(result);
      onClose?.();
    }

    return result;
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose?.()}>
        <Pressable style={styles.backdrop} onPress={() => onClose?.()}>
          <Pressable style={styles.sheet} onPress={() => null}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Add to Trip</Text>
                <Text style={styles.subtitle}>Choose a trip, then set when this place will be visited.</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={() => onClose?.()}>
                <Ionicons name="close" size={20} color="#222222" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {trips.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="map-outline" size={34} color="#A1A1AA" />
                  <Text style={styles.emptyTitle}>No trips yet</Text>
                  <Text style={styles.emptyText}>Create a trip to start grouping places together.</Text>
                </View>
              ) : (
                trips.map((trip) => {
                  const isDuplicate = tripHasPlace(trip);
                  const isChecking = checkingTripId === trip.id;

                  return (
                    <TouchableOpacity
                      key={trip.id}
                      style={[styles.tripOption, isDuplicate && styles.tripOptionDisabled]}
                      activeOpacity={0.88}
                      onPress={() => handleTripPress(trip)}
                    >
                      <View style={styles.tripOptionIcon}>
                        <Ionicons name="map-outline" size={18} color={colors.primary} />
                      </View>

                      <View style={styles.tripOptionContent}>
                        <Text style={styles.tripOptionTitle}>{trip.title || 'Untitled trip'}</Text>
                        <Text style={styles.tripOptionDescription} numberOfLines={2}>
                          {isChecking ? 'Checking trip...' : `${trip.start_date} - ${trip.end_date}`}
                          {isDuplicate ? ' · Already added' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                style={styles.createTripButton}
                activeOpacity={0.88}
                onPress={() => setCreateTripVisible(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createTripButtonText}>+ Create new trip</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <CreateTripModal
        visible={createTripVisible}
        onClose={handleCreateTripClose}
        onSave={createTrip}
      />

      <TripPlaceScheduleModal
        visible={scheduleVisible}
        trip={selectedTrip}
        placeName={place?.name}
        saveLabel="Add Place"
        onClose={() => setScheduleVisible(false)}
        onSave={handleSaveVisit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 270,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
  },
  tripOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  tripOptionDisabled: {
    opacity: 0.58,
  },
  tripOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripOptionContent: {
    flex: 1,
  },
  tripOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  tripOptionDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  createTripButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  createTripButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
});
