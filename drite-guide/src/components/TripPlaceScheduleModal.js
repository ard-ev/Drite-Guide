import React, { useEffect, useState } from 'react';
import {
  Alert,
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

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const isTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');

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

  useEffect(() => {
    if (!visible) {
      return;
    }

    setVisitDate(initialValues?.visitDate || initialValues?.visit_date || '');
    setVisitStartTime(initialValues?.visitStartTime || initialValues?.visit_start_time || '');
    setVisitEndTime(initialValues?.visitEndTime || initialValues?.visit_end_time || '');
    setNote(initialValues?.note || '');
    setDatePickerVisible(false);
  }, [initialValues, visible]);

  const validate = () => {
    const trimmedDate = visitDate.trim();
    const trimmedStartTime = visitStartTime.trim();
    const trimmedEndTime = visitEndTime.trim();

    if (trimmedDate && !isIsoDate(trimmedDate)) {
      Alert.alert('Invalid date', 'Use the date format YYYY-MM-DD.');
      return false;
    }

    if (trimmedDate && trip?.start_date && trimmedDate < trip.start_date) {
      Alert.alert('Invalid visit date', 'Visit date must be within the trip date range.');
      return false;
    }

    if (trimmedDate && trip?.end_date && trimmedDate > trip.end_date) {
      Alert.alert('Invalid visit date', 'Visit date must be within the trip date range.');
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

    if (trimmedStartTime && trimmedEndTime && trimmedEndTime < trimmedStartTime) {
      Alert.alert('Invalid time range', 'Visit end time must be after or equal to visit start time.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    const result = await onSave({
      visit_date: visitDate.trim() || null,
      visit_start_time: visitStartTime.trim() || null,
      visit_end_time: visitEndTime.trim() || null,
      note: note.trim() || null,
    });
    setIsSaving(false);

    if (!result?.success) {
      Alert.alert('Trip update failed', result?.message || 'Visit details could not be saved.');
      return;
    }

    onClose?.(result);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose?.()}>
      <Pressable style={styles.backdrop} onPress={() => onClose?.()}>
        <Pressable style={styles.sheet} onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Visit Details</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {placeName || 'Choose when this place will be visited.'}
              </Text>
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
            <Text style={styles.tripRange}>
              {trip?.start_date || 'Start date'} - {trip?.end_date || 'End date'}
            </Text>

            <Text style={styles.label}>Visit Date</Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={visitDate}
                onChangeText={setVisitDate}
                placeholder="2026-06-12"
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
                  value={visitStartTime}
                  onChangeText={setVisitStartTime}
                  placeholder="10:00"
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              <View style={styles.timeField}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={visitEndTime}
                  onChangeText={setVisitEndTime}
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
      </Pressable>

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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
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
