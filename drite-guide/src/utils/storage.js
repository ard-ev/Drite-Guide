import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStorage = new Map();

function isLegacyStorageError(error) {
  return error?.message?.includes('Native module is null');
}

export async function safeGetItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    if (isLegacyStorageError(error)) {
      return memoryStorage.has(key) ? memoryStorage.get(key) : null;
    }

    throw error;
  }
}

export async function safeSetItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    if (!isLegacyStorageError(error)) {
      throw error;
    }
  }

  memoryStorage.set(key, value);
}

export async function safeRemoveItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (!isLegacyStorageError(error)) {
      throw error;
    }
  }

  memoryStorage.delete(key);
}
