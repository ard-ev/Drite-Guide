const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(file, expected, message) {
  const source = read(file);
  if (!source.includes(expected)) {
    throw new Error(`${message}\nMissing in ${file}: ${expected}`);
  }
}

assertIncludes(
  'src/context/AppDataContext.js',
  'return (items || []).filter(Boolean).find(',
  'getPlaceById/getCityById must ignore null entries before reading item.id.'
);

assertIncludes(
  'src/screens/PlaceDetailScreen.js',
  'savedPlaces\n    .filter(Boolean)',
  'PlaceDetailScreen must ignore null saved places before reading item.id.'
);

assertIncludes(
  'src/screens/PlaceDetailScreen.js',
  'const place = routeParams.place || getPlaceById(placeId) || remotePlace;',
  'PlaceDetailScreen should resolve route payloads, app data, or remote fallback details.'
);

assertIncludes(
  'src/screens/PlaceDetailScreen.js',
  'api.get(`/places/${placeId}`)',
  'PlaceDetailScreen must have a remote fallback when app data lookup misses.'
);

assertIncludes(
  'src/context/AuthContext.js',
  '(currentUser ? savedPlaces : guestSavedPlaces).filter(Boolean)',
  'AuthContext must not expose null saved places.'
);

assertIncludes(
  'src/context/AuthContext.js',
  'const getTrips = () => trips.filter((trip) => trip?.id);',
  'AuthContext must not expose null trips before AddToTripModal reads trip.id.'
);

assertIncludes(
  'src/components/AddToTripModal.js',
  'const trips = (getTrips() || []).filter((trip) => trip?.id);',
  'AddToTripModal must ignore null trips before reading trip.id.'
);

assertIncludes(
  'src/components/AddToTripModal.js',
  'if (!selectedTrip?.id || !backendPlaceId)',
  'AddToTripModal must not save with a missing selected trip or place id.'
);

assertIncludes(
  'src/i18n/contentTranslations.js',
  '(dataSet.places || []).filter(Boolean).map((place)',
  'Localization must ignore null places before reading place.id.'
);

assertIncludes(
  'src/screens/HomeScreen.js',
  'return places\n      .filter(Boolean)',
  'Home search must ignore null places before reading place.id.'
);

assertIncludes(
  'src/screens/SearchResultsScreen.js',
  'places.filter(Boolean).forEach((place)',
  'Search suggestions must ignore null places before reading place.id.'
);

console.log('Place access null-safety checks passed.');
