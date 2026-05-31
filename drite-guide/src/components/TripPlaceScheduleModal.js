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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import CalendarPickerModal from './CalendarPickerModal';
import colors from '../theme/colors';
import {
  formatDateForDisplay,
  formatDateRangeForDisplay,
  isIsoDate,
  normalizeDateInput,
  parseDisplayDateToIso,
} from '../utils/dateFormat';
import { formatTimeForDisplay, isTime, normalizeTimeInput } from '../utils/timeFormat';

export default function TripPlaceScheduleModal({
  visible,
  trip,
  placeName,
  initialValues = null,
  saveLabel = 'Save Visit',
  onClose,
  onSave,
}) {
  const [visitDate, setVisitDate] = useState('');
  const [visitStartTime, setVisitStartTime] = useState('');
  const [visitEndTime, setVisitEndTime] = useState('');
  const [note, setNote] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      return;
    }

    setVisitDate(initialValues?.visitDate || initialValues?.visit_date || '');
    setVisitStartTime(formatTimeForDisplay(initialValues?.visitStartTime || initialValues?.visit_start_time));
    setVisitEndTime(formatTimeForDisplay(initialValues?.visitEndTime || initialValues?.visit_end_time));
    setNote(initialValues?.note || '');
    setDatePickerVisible(false);
  }, [initialValues, visible]);

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

  const validate = () => {
    const normalizedVisitDate = normalizeDateInput(visitDate);
    const trimmedStartTime = normalizeTimeInput(visitStartTime);
    const trimmedEndTime = normalizeTimeInput(visitEndTime);

    if (normalizedVisitDate && !isIsoDate(normalizedVisitDate)) {
      Alert.alert('Invalid date', 'Use the date format DD.MM.YYYY.');
      return false;
    }

    if (normalizedVisitDate && trip?.start_date && normalizedVisitDate < trip.start_date) {
      Alert.alert('Invalid visit date', 'Visit date must be within the trip date range.');
      return false;
    }

    if (normalizedVisitDate && trip?.end_date && normalizedVisitDate > trip.end_date) {
      Alert.alert('Invalid visit date', 'Visit date must be within the trip date range.');
      return false;
    }

    if ((trimmedStartTime || trimmedEndTime) && !normalizedVisitDate) {
      Alert.alert('Missing visit date', 'Choose a visit date before setting a time.');
      return false;
    }

    if (trimmedStartTime && !isTime(trimmedStartTime)) {
      Alert.alert('Invalid time', 'Use the time format HH:mm.');
      return false;
    }

    if (trimmedEndTime && !isTime(trimmedEndTime)) {
      Alert.alert('Invalid time', 'Use the time format HH:mm.');
      return false;
    }

    if ((trimmedStartTime && !trimmedEndTime) || (!trimmedStartTime && trimmedEndTime)) {
      Alert.alert('Missing time', 'Set both start time and end time.');
      return false;
    }

    if (trimmedStartTime && trimmedEndTime && trimmedEndTime < trimmedStartTime) {
      Alert.alert('Invalid time range', 'Visit end time must be after or equal to visit start time.');
      return false;
    }

    if (normalizedVisitDate && trimmedStartTime && trimmedEndTime) {
      const overlappingPlace = (trip?.places || []).filter(Boolean).find((tripPlace) => {
        const tripPlaceId = tripPlace.id;
        const initialTripPlaceId = initialValues?.id;

        if (tripPlaceId && initialTripPlaceId && String(tripPlaceId) === String(initialTripPlaceId)) {
          return false;
        }

        const tripPlaceDate = normalizeDateInput(tripPlace.visitDate || tripPlace.visit_date);
        const tripPlaceStartTime = normalizeTimeInput(
          tripPlace.visitStartTime || tripPlace.visit_start_time
        );
        const tripPlaceEndTime = normalizeTimeInput(
          tripPlace.visitEndTime || tripPlace.visit_end_time
        );

        if (!tripPlaceDate || !tripPlaceStartTime || !tripPlaceEndTime) {
          return false;
        }

        return (
          tripPlaceDate === normalizedVisitDate &&
          trimmedStartTime < tripPlaceEndTime &&
          trimmedEndTime > tripPlaceStartTime
        );
      });

      if (overlappingPlace) {
        const overlappingPlaceName = overlappingPlace.place?.name || 'another place';
        Alert.alert(
          'Time already used',
          `This time overlaps with ${overlappingPlaceName}. Choose another time slot.`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    const normalizedVisitDate = normalizeDateInput(visitDate);
    const normalizedStartTime = normalizeTimeInput(visitStartTime);
    const normalizedEndTime = normalizeTimeInput(visitEndTime);
    const result = await onSave({
      visit_date: normalizedVisitDate || null,
      visit_start_time: normalizedStartTime || null,
      visit_end_time: normalizedEndTime || null,
      note: note.trim() || null,
    });
    setIsSaving(false);

    if (!result?.success) {
      Alert.alert('Trip update failed', result?.message || 'Visit details could not be saved.');
      return;
    }

    closeWithAnimation(result);
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={() => closeWithAnimation()}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[styles.backdropOverlay, styles.noPointerEvents, { opacity: backdropOpacity }]}
        />
        <Pressable style={styles.backdropPressArea} onPress={() => closeWithAnimation()} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <Pressable onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Visit Details</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {placeName || 'Choose when this place will be visited.'}
              </Text>
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
            <Text style={styles.tripRange}>
              {formatDateRangeForDisplay(trip?.start_date, trip?.end_date)}
            </Text>

            <Text style={styles.label}>Visit Date</Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={formatDateForDisplay(visitDate)}
                onChangeText={(text) => setVisitDate(parseDisplayDateToIso(text))}
                placeholder="12.06.2026"
                placeholderTextColor="#A1A1AA"
              />
              <TouchableOpacity
                style={styles.calendarButton}
                activeOpacity={0.86}
                onPress={() => setDatePickerVisible(true)}
              >
                <Ionicons name="calendar-outline" size={19} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={formatTimeForDisplay(visitStartTime)}
                  onChangeText={(text) => setVisitStartTime(normalizeTimeInput(text))}
                  placeholder="10:00"
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              <View style={styles.timeField}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={formatTimeForDisplay(visitEndTime)}
                  onChangeText={(text) => setVisitEndTime(normalizeTimeInput(text))}
                  placeholder="14:00"
                  placeholderTextColor="#A1A1AA"
                />
              </View>
            </View>

            <Text style={styles.label}>Place Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Go early before it gets crowded."
              placeholderTextColor="#A1A1AA"
              multiline
            />

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : saveLabel}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
        </Animated.View>
      </View>

      <CalendarPickerModal
        visible={datePickerVisible}
        value={visitDate}
        minDate={trip?.start_date}
        maxDate={trip?.end_date}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => {
          setVisitDate(date);
          setDatePickerVisible(false);
        }}
      />
    </Modal>
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
    maxHeight: '92%',
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
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    marginTop: 5,
    maxWidth: 260,
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
  tripRange: {
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  input: {
    minHeight: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#222222',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeField: {
    flex: 1,
    minWidth: 130,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
