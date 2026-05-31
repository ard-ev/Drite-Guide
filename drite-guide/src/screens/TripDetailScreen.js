import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import CreateTripModal from '../components/CreateTripModal';
import TripPlacePickerModal from '../components/TripPlacePickerModal';
import TripPlaceScheduleModal from '../components/TripPlaceScheduleModal';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { formatDateForDisplay, formatDateRangeForDisplay } from '../utils/dateFormat';
import { formatTimeForDisplay } from '../utils/timeFormat';
import { getImageSource } from '../utils/placeMeta';

export default function TripDetailScreen({ route }) {
  const { tripId } = route.params || {};
  const navigation = useNavigation();
  const {
    currentUser,
    isLoggedIn,
    getTrip,
    updateTrip,
    deleteTrip,
    addPlaceToTrip,
    updateTripPlace,
    removeTripPlace,
  } = useAuth();
  const { getPlaceById } = useAppData();

  const [trip, setTrip] = useState(route.params?.trip || null);
  const [isLoading, setIsLoading] = useState(true);
  const [editTripVisible, setEditTripVisible] = useState(false);
  const [placePickerVisible, setPlacePickerVisible] = useState(false);
  const [addingPlaceId, setAddingPlaceId] = useState(null);
  const [editingTripPlace, setEditingTripPlace] = useState(null);
  const [isEditingSharedNote, setIsEditingSharedNote] = useState(false);
  const [sharedNoteDraft, setSharedNoteDraft] = useState('');
  const [isSavingSharedNote, setIsSavingSharedNote] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const sharedNoteInputY = useRef(0);

  const loadTrip = useCallback(async () => {
    if (!isLoggedIn || !tripId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getTrip(tripId);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Trip unavailable', result.message);
      return;
    }

    setTrip(result.trip);
  }, [getTrip, isLoggedIn, tripId]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isOwner =
    trip?.ownerId === currentUser?.id ||
    trip?.owner_id === currentUser?.id ||
    trip?.role === 'owner';
  const currentMember = (trip?.members || []).find(
    (member) => (member.userId || member.user_id) === currentUser?.id
  );
  const canEditSharedNote = isOwner || currentMember?.status === 'accepted';

  const handleSaveTrip = async (payload) => {
    const result = await updateTrip(trip.id, payload);
    if (result.success) {
      setTrip(result.trip);
    }
    return result;
  };

  const handleEditTripClose = (updatedTrip) => {
    setEditTripVisible(false);
    if (updatedTrip?.id) {
      setTrip(updatedTrip);
    }
  };

  const startEditingSharedNote = () => {
    setSharedNoteDraft(trip.sharedNote || trip.shared_note || '');
    setIsEditingSharedNote(true);
  };

  const handleSaveSharedNote = async () => {
    setIsSavingSharedNote(true);
    const result = await updateTrip(trip.id, {
      shared_note: sharedNoteDraft.trim() ? sharedNoteDraft : null,
    });
    setIsSavingSharedNote(false);

    if (!result.success) {
      Alert.alert('Shared note update failed', result.message);
      return;
    }

    setTrip(result.trip);
    setIsEditingSharedNote(false);
  };

  const scrollToSharedNoteInput = () => {
    window.setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(sharedNoteInputY.current - 84, 0),
        animated: true,
      });
    }, 120);
  };

  const handleUpdateTripPlace = async (payload) => {
    const result = await updateTripPlace(trip.id, editingTripPlace.id, payload);
    if (result.success) {
      await loadTrip();
    }
    return result;
  };

  const mergeTripPlaceIntoTrip = (tripPlace, fallbackPlace = null) => {
    if (!tripPlace?.id) {
      return;
    }

    setTrip((currentTrip) => {
      if (!currentTrip?.id) {
        return currentTrip;
      }

      const nextTripPlace = {
        ...tripPlace,
        place: tripPlace.place || fallbackPlace,
      };
      const existingPlaces = (currentTrip.places || []).filter(Boolean);
      const alreadyExists = existingPlaces.some(
        (item) => String(item.id) === String(nextTripPlace.id)
      );
      const nextPlaces = alreadyExists
        ? existingPlaces.map((item) =>
            String(item.id) === String(nextTripPlace.id) ? nextTripPlace : item
          )
        : [...existingPlaces, nextTripPlace];

      return {
        ...currentTrip,
        places: nextPlaces.sort((firstItem, secondItem) =>
          (firstItem.orderIndex ?? firstItem.order_index ?? 0) -
          (secondItem.orderIndex ?? secondItem.order_index ?? 0)
        ),
        placesCount: nextPlaces.length,
        places_count: nextPlaces.length,
      };
    });
  };

  const handleSelectPlaceToAdd = async (place) => {
    if (!place?.id || addingPlaceId) {
      return;
    }

    const nextAddingPlaceId = place.id;
    setAddingPlaceId(nextAddingPlaceId);
    const result = await addPlaceToTrip(trip.id, {
      place_id: nextAddingPlaceId,
    });

    if (result.success) {
      if (result.trip?.id) {
        setTrip(result.trip);
      } else {
        mergeTripPlaceIntoTrip(result.tripPlace, place);
      }

      setPlacePickerVisible(false);
      await loadTrip();
    } else {
      Alert.alert('Trip update failed', result.message || 'This place could not be added.');
    }

    setAddingPlaceId(null);
  };

  const handleRemoveTripPlace = (tripPlace) => {
    Alert.alert(
      'Remove place',
      'Remove this place from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeTripPlace(trip.id, tripPlace.id);
            if (!result.success) {
              Alert.alert('Trip update failed', result.message);
              return;
            }
            await loadTrip();
          },
        },
      ]
    );
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete trip',
      'Delete this trip and all related places?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTrip(trip.id);
            if (!result.success) {
              Alert.alert('Trip deletion failed', result.message);
              return;
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const resolveTripPlace = (tripPlace) => {
    const placeId = tripPlace.placeId || tripPlace.place_id;
    return tripPlace.place || getPlaceById(placeId) || {};
  };

  const getVisitMeta = (tripPlace) => {
    const date = tripPlace.visitDate || tripPlace.visit_date;
    const formattedDate = formatDateForDisplay(date);
    const startTime = formatTimeForDisplay(tripPlace.visitStartTime || tripPlace.visit_start_time);
    const endTime = formatTimeForDisplay(tripPlace.visitEndTime || tripPlace.visit_end_time);
    const timeRange = startTime || endTime ? `${startTime || '--:--'} - ${endTime || '--:--'}` : '';
    return [formattedDate, timeRange].filter(Boolean).join(' - ') || 'Visit time not set';
  };

  const existingPlaceIds = (trip?.places || []).map(
    (tripPlace) =>
      tripPlace.placeId ||
      tripPlace.place_id ||
      tripPlace.place?.id
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.centerCard}>
            <Ionicons name="map-outline" size={52} color="#A1A1AA" />
            <Text style={styles.emptyTitle}>Sign in required</Text>
            <Text style={styles.emptySubtitle}>Create an account or sign in to view trips.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading && !trip) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.centerCard}>
            <Ionicons name="alert-circle-outline" size={52} color="#A1A1AA" />
            <Text style={styles.emptyTitle}>Trip not found</Text>
            <Text style={styles.emptySubtitle}>This trip could not be loaded.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 120 },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trip Details</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => (isOwner ? setEditTripVisible(true) : null)}
              disabled={!isOwner}
            >
              <Ionicons name="create-outline" size={21} color={isOwner ? colors.primary : '#C7C7CC'} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.tripBadge}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.tripTitle}>{trip.title}</Text>
            <Text style={styles.tripDateRange}>
              {formatDateRangeForDisplay(trip.start_date, trip.end_date)}
            </Text>
            {trip.description ? (
              <Text style={styles.tripDescription}>{trip.description}</Text>
            ) : null}

            <View style={styles.actionRow}>
              {isOwner ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.88}
                  onPress={() => setPlacePickerVisible(true)}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Add Place</Text>
                </TouchableOpacity>
              ) : null}

              {isOwner ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  activeOpacity={0.88}
                  onPress={handleDeleteTrip}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Shared Note</Text>
              </View>
              {canEditSharedNote ? (
                <TouchableOpacity
                  style={styles.noteEditButton}
                  activeOpacity={0.86}
                  onPress={isEditingSharedNote ? handleSaveSharedNote : startEditingSharedNote}
                  disabled={isSavingSharedNote}
                >
                  <Ionicons
                    name={isEditingSharedNote ? 'checkmark' : 'create-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.noteEditButtonText}>
                    {isEditingSharedNote ? (isSavingSharedNote ? 'Saving...' : 'Save') : 'Edit'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {isEditingSharedNote ? (
              <>
                <TextInput
                  style={styles.sharedNoteInput}
                  value={sharedNoteDraft}
                  onChangeText={setSharedNoteDraft}
                  onFocus={scrollToSharedNoteInput}
                  onLayout={(event) => {
                    sharedNoteInputY.current = event.nativeEvent.layout.y;
                  }}
                  placeholder="Add notes everyone can see."
                  placeholderTextColor="#A1A1AA"
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.noteCancelButton}
                  activeOpacity={0.86}
                  onPress={() => setIsEditingSharedNote(false)}
                  disabled={isSavingSharedNote}
                >
                  <Text style={styles.noteCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.bodyText}>{trip.sharedNote || trip.shared_note || 'No shared note yet.'}</Text>
            )}
          </View>


          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Trip Places</Text>
              </View>
              <Text style={styles.countText}>{trip.places?.length || 0}</Text>
            </View>

            {(trip.places || []).length === 0 ? (
              <View style={styles.emptyInlineCard}>
                <Text style={styles.emptyInlineTitle}>No places added yet</Text>
                <Text style={styles.emptyInlineText}>Tap Add Place to start planning visits.</Text>
              </View>
            ) : (
              (trip.places || []).map((tripPlace) => {
                const place = resolveTripPlace(tripPlace);

                return (
                  <View key={tripPlace.id} style={styles.placeCard}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() =>
                        navigation.navigate('PlaceDetails', {
                          placeId: place.id || tripPlace.placeId || tripPlace.place_id,
                        })
                      }
                    >
                      <Image
                        source={getImageSource(place.image)}
                        style={styles.placeImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>

                    <View style={styles.placeContent}>
                      <Text style={styles.placeTitle}>{place.name || 'Unnamed place'}</Text>
                      <Text style={styles.placeMeta}>{getVisitMeta(tripPlace)}</Text>
                      {tripPlace.note ? (
                        <Text style={styles.placeNote}>{tripPlace.note}</Text>
                      ) : null}

                      <View style={styles.placeActionRow}>
                        <TouchableOpacity
                          style={styles.placeActionButton}
                          activeOpacity={0.88}
                          onPress={() => setEditingTripPlace(tripPlace)}
                        >
                          <Ionicons name="time-outline" size={16} color={colors.primary} />
                          <Text style={styles.placeActionText}>Edit Visit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.placeActionButton}
                          activeOpacity={0.88}
                          onPress={() => handleRemoveTripPlace(tripPlace)}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.primary} />
                          <Text style={styles.placeActionText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        <CreateTripModal
          visible={editTripVisible}
          initialTrip={trip}
          onClose={handleEditTripClose}
          onSave={handleSaveTrip}
        />

        <TripPlacePickerModal
          visible={placePickerVisible}
          existingPlaceIds={existingPlaceIds}
          addingPlaceId={addingPlaceId}
          onClose={() => setPlacePickerVisible(false)}
          onSelectPlace={handleSelectPlaceToAdd}
        />

        <TripPlaceScheduleModal
          visible={Boolean(editingTripPlace)}
          trip={trip}
          placeName={editingTripPlace ? resolveTripPlace(editingTripPlace).name : ''}
          initialValues={editingTripPlace}
          saveLabel="Save Visit"
          onClose={() => setEditingTripPlace(null)}
          onSave={handleUpdateTripPlace}
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
  keyboardAvoider: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
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
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
    elevation: 4,
  },
  tripBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  tripTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222222',
  },
  tripDateRange: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  tripDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: 13,
    gap: 8,
  },
  dangerButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  noteEditButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 13,
    paddingHorizontal: 11,
    gap: 5,
  },
  noteEditButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  sharedNoteInput: {
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#222222',
  },
  noteCancelButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  noteCancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
  },
  emptyInlineCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  emptyInlineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222222',
  },
  emptyInlineText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  placeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  placeImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },
  placeContent: {
    padding: 14,
  },
  placeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },
  placeMeta: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  placeNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
  },
  placeActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  placeActionButton: {
    flexGrow: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    gap: 6,
  },
  placeActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
