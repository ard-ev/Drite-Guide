export function getSupabaseErrorMessage(error, fallbackMessage = 'Something went wrong.') {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error_description) {
    return error.error_description;
  }

  return fallbackMessage;
}

export function throwIfSupabaseError(error, fallbackMessage) {
  if (error) {
    throw new Error(getSupabaseErrorMessage(error, fallbackMessage));
  }
}

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
}

export function sanitizeSearchTerm(value) {
  return String(value || '')
    .trim()
    .replace(/[%,()]/g, '')
    .slice(0, 80);
}
