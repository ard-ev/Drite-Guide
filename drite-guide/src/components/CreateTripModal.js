import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
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
import UserInviteInput from './UserInviteInput';
import colors from '../theme/colors';
import {
  formatDateForDisplay,
  isIsoDate,
  normalizeDateInput,
  parseDisplayDateToIso,
} from '../utils/dateFormat';

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
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(36)).current;
  const scrollRef = useRef(null);
  const inputLayouts = useRef({});

  const isEditing = Boolean(initialTrip?.id);
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

    setTitle(initialTrip?.title || '');
    setDescription(initialTrip?.description || '');
    setStartDate(initialTrip?.start_date || '');
    setEndDate(initialTrip?.end_date || '');
    setSharedNote(initialTrip?.shared_note || initialTrip?.sharedNote || '');
    setInviteUsernames('');
    setDatePickerVisible(false);
  }, [initialTrip, visible]);

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
    const normalizedStartDate = normalizeDateInput(startDate);
    const normalizedEndDate = normalizeDateInput(endDate);

    if (!title.trim()) {
      Alert.alert('Missing required fields', 'Trip title is required.');
      return false;
    }

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Missing required fields', 'Start date and end date are required.');
      return false;
    }

    if (!isIsoDate(normalizedStartDate) || !isIsoDate(normalizedEndDate)) {
      Alert.alert('Invalid date', 'Use the date format DD.MM.YYYY.');
      return false;
    }

    if (normalizedEndDate < normalizedStartDate) {
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
    const normalizedStartDate = normalizeDateInput(startDate);
    const normalizedEndDate = normalizeDateInput(endDate);
    const result = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      start_date: normalizedStartDate,
      end_date: normalizedEndDate,
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

    closeWithAnimation(result.trip);
  };

  const handleSelectDateRange = ({ startDate: nextStartDate, endDate: nextEndDate }) => {
    if (nextStartDate !== undefined) {
      setStartDate(nextStartDate);
    }

    if (nextEndDate !== undefined) {
      setEndDate(nextEndDate);
    }

    if (nextStartDate && nextEndDate) {
      setDatePickerVisible(false);
    }
  };

  const registerInputLayout = (key) => (event) => {
    inputLayouts.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToInput = (key) => {
    window.setTimeout(() => {
      const y = inputLayouts.current[key];
      if (typeof y === 'number') {
        scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
      }
    }, 120);
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={() => closeWithAnimation()}>
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropOverlay, { opacity: backdropOpacity }]}
        />
        <Pressable style={styles.backdropPressArea} onPress={() => closeWithAnimation()} />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <Pressable onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Trip' : 'Create Trip'}</Text>
              <Text style={styles.subtitle}>Plan the dates, people, places, and shared note.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => closeWithAnimation()}>
              <Ionicons name="close" size={20} color="#222222" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 28 },
            ]}
          >
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              onFocus={() => scrollToInput('title')}
              onLayout={registerInputLayout('title')}
              placeholder="Albania Summer 2026"
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              onFocus={() => scrollToInput('description')}
              onLayout={registerInputLayout('description')}
              placeholder="Summer trip through Albania"
              placeholderTextColor="#A1A1AA"
              multiline
            />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={formatDateForDisplay(startDate)}
                  onChangeText={(text) => setStartDate(parseDisplayDateToIso(text))}
                  onFocus={() => scrollToInput('startDate')}
                  onLayout={registerInputLayout('startDate')}
                  placeholder="10.06.2026"
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              <View style={styles.dateField}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={formatDateForDisplay(endDate)}
                  onChangeText={(text) => setEndDate(parseDisplayDateToIso(text))}
                  onFocus={() => scrollToInput('endDate')}
                  onLayout={registerInputLayout('endDate')}
                  placeholder="18.06.2026"
                  placeholderTextColor="#A1A1AA"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.dateRangeButton}
              activeOpacity={0.86}
              onPress={() => setDatePickerVisible(true)}
            >
              <Ionicons name="calendar-outline" size={19} color={colors.primary} />
              <Text style={styles.dateRangeButtonText}>Choose date range</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Shared Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={sharedNote}
              onChangeText={setSharedNote}
              onFocus={() => scrollToInput('sharedNote')}
              onLayout={registerInputLayout('sharedNote')}
              placeholder="Bring sunscreen and cash."
              placeholderTextColor="#A1A1AA"
              multiline
            />

            {!isEditing && onInviteUsersAfterCreate ? (
              <>
                <Text style={styles.label}>Invite Users</Text>
                <UserInviteInput
                  multiple
                  inputStyle={styles.input}
                  value={inviteUsernames}
                  onChangeText={setInviteUsernames}
                  onFocus={() => scrollToInput('inviteUsers')}
                  onLayout={registerInputLayout('inviteUsers')}
                  placeholder="username, friendname"
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
        </Animated.View>
      </View>

      <CalendarPickerModal
        visible={datePickerVisible}
        rangeMode
        startValue={startDate}
        endValue={endDate}
        onClose={() => setDatePickerVisible(false)}
        onSelectRange={handleSelectDateRange}
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
  scrollContent: {
    paddingBottom: 4,
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
  dateRangeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 16,
    marginTop: -2,
    marginBottom: 14,
    gap: 8,
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
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
