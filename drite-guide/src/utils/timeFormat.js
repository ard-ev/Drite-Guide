const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_WITH_SECONDS_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export const formatTimeForDisplay = (value) => {
  const trimmedValue = (value || '').trim();

  if (TIME_WITH_SECONDS_PATTERN.test(trimmedValue)) {
    return trimmedValue.slice(0, 5);
  }

  return trimmedValue;
};

export const normalizeTimeInput = (value) => formatTimeForDisplay(value);

export const isTime = (value) => TIME_PATTERN.test(normalizeTimeInput(value));
