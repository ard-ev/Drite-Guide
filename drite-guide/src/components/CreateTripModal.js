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

export default function CreateTripModal({
  visible,
  initialTrip = null,
  onClose,
  onSave,
  onInviteUsersAfterCreate,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [inviteUsernames, setInviteUsernames] = useState('');
  const [datePickerField, setDatePickerField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(initialTrip?.id);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(initialTrip?.title || '');
    setDescription(initialTrip?.description || '');
    setStartDate(initialTrip?.start_date || '');
    setEndDate(initialTrip?.end_date || '');
    setSharedNote(initialTrip?.shared_note || initialTrip?.sharedNote || '');
    setInviteUsernames('');
    setDatePickerField(null);
  }, [initialTrip, visible]);

  const validate = () => {
    if (!title.trim()) {
      Alert.alert('Missing required fields', 'Trip title is required.');
      return false;
    }

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Missing required fields', 'Start date and end date are required.');
      return false;
    }

    if (!isIsoDate(startDate.trim()) || !isIsoDate(endDate.trim())) {
      Alert.alert('Invalid date', 'Use the date format YYYY-MM-DD.');
      return false;
    }

    if (endDate.trim() < startDate.trim()) {
      Alert.alert('Invalid date range', 'End date must be after or equal to start date.');
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
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate.trim(),
      end_date: endDate.trim(),
      shared_note: sharedNote.trim() || null,
    });
    setIsSaving(false);

    if (!result?.success) {
      Alert.alert('Trip save failed', result?.message || 'Trip could not be saved.');
      return;
    }

    if (!isEditing && inviteUsernames.trim() && onInviteUsersAfterCreate) {
      const inviteResult = await onInviteUsersAfterCreate(
        result.trip,
        inviteUsernames
          .split(/[\s,]+/)
          .map((item) => item.trim().replace(/^@/, ''))
          .filter(Boolean)
      );

      if (!inviteResult?.success) {
        Alert.alert(
          'Trip created',
          inviteResult?.message || 'The trip was created, but some users could not be invited.'
        );
      }
    }

    onClose?.(result.trip);
  };

  const handleSelectDate = (date) => {
    if (datePickerField === 'start') {
      setStartDate(date);
    }

    if (datePickerField === 'end') {
      setEndDate(date);
    }

    setDatePickerField(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose?.()}>
      <Pressable style={styles.backdrop} onPress={() => onClose?.()}>
        <Pressable style={styles.sheet} onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Trip' : 'Create Trip'}</Text>
              <Text style={styles.subtitle}>Plan the dates, people, places, and shared note.</Text>
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
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Albania Summer 2026"
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Summer trip through Albania"
              placeholderTextColor="#A1A1AA"
              multiline
            />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Start Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-06-10"
                    placeholderTextColor="#A1A1AA"
                  />
                  <TouchableOpacity
                    style={styles.calendarButton}
                    activeOpacity={0.86}
                    onPress={() => setDatePickerField('start')}
                  >
                    <Ionicons name="calendar-outline" size={19} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateField}>
                <Text style={styles.label}>End Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-06-18"
                    placeholderTextColor="#A1A1AA"
                  />
                  <TouchableOpacity
                    style={styles.calendarButton}
                    activeOpacity={0.86}
                    onPress={() => setDatePickerField('end')}
                  >
                    <Ionicons name="calendar-outline" size={19} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Shared Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={sharedNote}
              onChangeText={setSharedNote}
              placeholder="Bring sunscreen and cash."
              placeholderTextColor="#A1A1AA"
              multiline
            />

            {!isEditing && onInviteUsersAfterCreate ? (
              <>
                <Text style={styles.label}>Invite Users</Text>
                <TextInput
                  style={styles.input}
                  value={inviteUsernames}
                  onChangeText={setInviteUsernames}
                  placeholder="username, friendname"
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="none"
                />
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Trip'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>

      <CalendarPickerModal
        visible={Boolean(datePickerField)}
        value={datePickerField === 'start' ? startDate : endDate}
        minDate={datePickerField === 'end' ? startDate : undefined}
        maxDate={datePickerField === 'start' ? endDate : undefined}
        onClose={() => setDatePickerField(null)}
        onSelect={handleSelectDate}
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
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    marginTop: 6,
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
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateField: {
    flex: 1,
    minWidth: 130,
  },
  saveButton: {
    marginTop: 4,
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
