const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;

const isValidIsoDateParts = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const isIsoDate = (value) => {
  if (!ISO_DATE_PATTERN.test(value || '')) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  return isValidIsoDateParts(year, month, day);
};

export const formatDateForDisplay = (value) => {
  if (!isIsoDate(value)) {
    return value || '';
  }

  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
};

export const parseDisplayDateToIso = (value) => {
  const trimmedValue = (value || '').trim();

  if (isIsoDate(trimmedValue)) {
    return trimmedValue;
  }

  if (!DISPLAY_DATE_PATTERN.test(trimmedValue)) {
    return value;
  }

  const [day, month, year] = trimmedValue.split('.').map(Number);
  if (!isValidIsoDateParts(year, month, day)) {
    return value;
  }

  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`.replace(/\./g, '-');
};

export const normalizeDateInput = (value) => parseDisplayDateToIso((value || '').trim());

export const formatDateRangeForDisplay = (startDate, endDate) => {
  const formattedStartDate = formatDateForDisplay(startDate) || 'Start date';
  const formattedEndDate = formatDateForDisplay(endDate) || 'End date';
  return `${formattedStartDate} - ${formattedEndDate}`;
};
