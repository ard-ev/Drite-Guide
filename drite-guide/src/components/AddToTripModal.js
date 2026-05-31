import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { formatDateRangeForDisplay } from '../utils/dateFormat';

export default function AddToTripModal({ visible, place, onClose, onAdded }) {
  const { getTrips, getTrip, createTrip, addPlaceToTrip } = useAuth();
  const supabasePlaceId = place?.id;
  const trips = (getTrips() || []).filter((trip) => trip?.id);
  const [checkingTripId, setCheckingTripId] = useState(null);
  const [addingTripId, setAddingTripId] = useState(null);
  const [addedTripId, setAddedTripId] = useState(null);
  const [createTripVisible, setCreateTripVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(42);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 30,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }
  }, [backdropOpacity, isMounted, sheetTranslateY, visible]);

  useEffect(() => {
    if (!visible) {
      setCheckingTripId(null);
      setAddingTripId(null);
      setAddedTripId(null);
      setCreateTripVisible(false);
    }
  }, [visible]);

  const closeWithAnimation = (result) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 30,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.(result);
    });
  };

  const tripHasPlace = (trip) => {
    if (!supabasePlaceId) {
      return false;
    }

    return (trip?.places || []).filter(Boolean).some((tripPlace) => {
      const tripPlaceId = tripPlace?.placeId || tripPlace?.place_id;
      return String(tripPlaceId) === String(supabasePlaceId);
    });
  };

  const handleTripPress = async (trip) => {
    if (!trip?.id || checkingTripId || addingTripId || addedTripId) {
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

    setAddingTripId(trip.id);
    const addResult = await addPlaceToTrip(trip.id, {
      place_id: supabasePlaceId,
    });
    setAddingTripId(null);

    if (!addResult.success) {
      Alert.alert('Trip update failed', addResult.message || 'This place could not be added.');
      return;
    }

    setAddedTripId(trip.id);
    onAdded?.(addResult);
    window.setTimeout(() => {
      closeWithAnimation(addResult);
    }, 650);
  };

  const handleCreateTripClose = async (createdTrip) => {
    setCreateTripVisible(false);

    if (createdTrip?.id) {
      setAddingTripId(createdTrip.id);
      const addResult = await addPlaceToTrip(createdTrip.id, {
        place_id: supabasePlaceId,
      });
      setAddingTripId(null);

      if (!addResult.success) {
        Alert.alert('Trip update failed', addResult.message || 'This place could not be added.');
        return;
      }

      setAddedTripId(createdTrip.id);
      onAdded?.(addResult);
      window.setTimeout(() => {
        closeWithAnimation(addResult);
      }, 650);
    }
  };

  return (
    <>
      <Modal
        visible={isMounted && !createTripVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeWithAnimation()}
      >
        <View style={styles.modalRoot}>
          <Animated.View
            style={[styles.backdropOverlay, styles.noPointerEvents, { opacity: backdropOpacity }]}
          />
          <Pressable style={styles.backdropPressArea} onPress={() => closeWithAnimation()} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <Pressable onPress={() => null}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Add to Trip</Text>
                <Text style={styles.subtitle}>Choose a trip to add this place.</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={() => closeWithAnimation()}>
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
                  const isAdding = addingTripId === trip.id;
                  const isAdded = addedTripId === trip.id;

                  return (
                    <TouchableOpacity
                      key={trip.id}
                      style={[
                        styles.tripOption,
                        (isDuplicate || isChecking || isAdding || isAdded) && styles.tripOptionDisabled,
                        isAdded && styles.tripOptionAdded,
                      ]}
                      activeOpacity={0.88}
                      disabled={isDuplicate || isChecking || isAdding || isAdded}
                      onPress={() => handleTripPress(trip)}
                    >
                      <View style={[styles.tripOptionIcon, isAdded && styles.tripOptionIconAdded]}>
                        <Ionicons
                          name={isAdded ? 'checkmark' : 'map-outline'}
                          size={18}
                          color={isAdded ? '#FFFFFF' : colors.primary}
                        />
                      </View>

                      <View style={styles.tripOptionContent}>
                        <Text style={styles.tripOptionTitle}>{trip.title || 'Untitled trip'}</Text>
                        <Text style={styles.tripOptionDescription} numberOfLines={2}>
                          {isAdded
                            ? 'Added to Trip'
                            : isAdding
                              ? 'Adding to trip...'
                              : isChecking
                                ? 'Checking trip...'
                                : formatDateRangeForDisplay(trip.start_date, trip.end_date)}
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
                <Text style={styles.createTripButtonText}>Create new trip</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <CreateTripModal
        visible={createTripVisible}
        onClose={handleCreateTripClose}
        onSave={createTrip}
      />

    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
  backdropPressArea: {
    ...StyleSheet.absoluteFillObject,
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
  tripOptionAdded: {
    opacity: 1,
    backgroundColor: '#ECFDF5',
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
  tripOptionIconAdded: {
    backgroundColor: '#10B981',
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
