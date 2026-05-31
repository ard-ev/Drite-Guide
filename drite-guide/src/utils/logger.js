export function logWarning(...args) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(...args);
  }
}
