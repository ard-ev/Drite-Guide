import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialMonth = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date();
};

export default function CalendarPickerModal({
  visible,
  value,
  minDate,
  maxDate,
  onClose,
  onSelect,
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value));

  useEffect(() => {
    if (visible) {
      setVisibleMonth(getInitialMonth(value));
    }
  }, [value, visible]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const offset = (firstDay.getDay() + 6) % 7;
    const cells = [];

    for (let index = 0; index < offset; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  const changeMonth = (amount) => {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1)
    );
  };

  const isDisabled = (date) => {
    const isoDate = toIsoDate(date);
    return Boolean((minDate && isoDate < minDate) || (maxDate && isoDate > maxDate));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => null}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color="#222222" />
            </TouchableOpacity>

            <Text style={styles.title}>
              {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>

            <TouchableOpacity style={styles.iconButton} onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color="#222222" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {dayNames.map((dayName) => (
              <Text key={dayName} style={styles.weekText}>
                {dayName}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const isoDate = toIsoDate(date);
              const selected = isoDate === value;
              const disabled = isDisabled(date);

              return (
                <TouchableOpacity
                  key={isoDate}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    disabled && styles.dayCellDisabled,
                  ]}
                  activeOpacity={0.82}
                  disabled={disabled}
                  onPress={() => onSelect?.(isoDate)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.32,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextDisabled: {
    color: '#9CA3AF',
  },
});
