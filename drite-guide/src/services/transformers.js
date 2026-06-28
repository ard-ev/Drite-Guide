import { getProfilePictureUrl, toAbsoluteAssetUrl } from '../config/assets';
import { normalizeLanguageCode } from '../i18n/translations';
import { STORAGE_BUCKETS } from '../lib/supabase';

function withContentVersion(url, updatedAt) {
  if (!url || !updatedAt || !/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(updatedAt)}`;
}

function getContentTranslation(item, languageCode) {
  const language = normalizeLanguageCode(languageCode);

  if (!Array.isArray(item?.translations)) {
    return null;
  }

  return item.translations.find(
    (translation) => translation?.language_code === language
  ) || null;
}

function translatedValue(item, translation, key, fallback) {
  const value = translation?.[key];

  const itemUpdatedAt = Date.parse(item?.updated_at || '');
  const translationUpdatedAt = Date.parse(translation?.updated_at || '');
  const translationIsStale =
    Number.isFinite(itemUpdatedAt) &&
    Number.isFinite(translationUpdatedAt) &&
    itemUpdatedAt > translationUpdatedAt;

  if (translationIsStale) {
    return fallback;
  }

  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizeCategory(category, options = {}) {
  if (!category) {
    return null;
  }

  const translation = getContentTranslation(category, options.language);

  return {
    ...category,
    id: category.id,
    legacyId: category.id,
    name: translatedValue(category, translation, 'name', category.name),
    subtitle: translatedValue(
      category,
      translation,
      'subtitle',
      category.subtitle
    ),
    image: withContentVersion(
      toAbsoluteAssetUrl(category.image_path, STORAGE_BUCKETS.categoryImages),
      category.updated_at
    ),
  };
}

export function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const profilePictureUrl = getProfilePictureUrl(user.profile_picture_path);
  const profilePictureVersion = user.updated_at
    ? encodeURIComponent(user.updated_at)
    : '';
  const userId = user.id;

  return {
    ...user,
    id: userId,
    profile_picture_path:
      profilePictureUrl && profilePictureVersion
        ? `${profilePictureUrl}${profilePictureUrl.includes('?') ? '&' : '?'}v=${profilePictureVersion}`
        : profilePictureUrl,
  };
}

export function normalizeCity(city, options = {}) {
  if (!city) {
    return null;
  }

  const translation = getContentTranslation(city, options.language);
  const cityName = translatedValue(
    city,
    translation,
    'city_name',
    city.city_name
  );

  return {
    ...city,
    id: city.id,
    legacyId: city.id,
    city_name: cityName,
    name: cityName,
    description: translatedValue(
      city,
      translation,
      'description',
      city.description
    ),
    image: withContentVersion(
      toAbsoluteAssetUrl(city.image_path, STORAGE_BUCKETS.cityImages),
      city.updated_at
    ),
    heroImage: withContentVersion(
      toAbsoluteAssetUrl(city.hero_image_path, STORAGE_BUCKETS.cityImages),
      city.updated_at
    ),
  };
}

export function normalizePlace(place, options = {}) {
  if (!place) {
    return null;
  }

  const translation = getContentTranslation(place, options.language);
  const mainImage = toAbsoluteAssetUrl(
    place.main_image_path,
    STORAGE_BUCKETS.placeImages
  );
  const imagePaths = Array.isArray(place.images)
    ? place.images.map((item) => item?.image_path).filter(Boolean)
    : [];

  return {
    ...place,
    imageSourcePath: place.main_image_path || null,
    imageSourcePaths: imagePaths,
    id: place.id,
    legacyId: place.id,
    name: translatedValue(place, translation, 'name', place.name),
    description: translatedValue(
      place,
      translation,
      'description',
      place.description
    ),
    address: translatedValue(place, translation, 'address', place.address),
    opening_hours: translatedValue(
      place,
      translation,
      'opening_hours',
      place.opening_hours
    ),
    cityId: place.city_id,
    categoryId: place.category_id,
    cityName: options.cityName || '',
    categoryName: options.categoryName || '',
    image: withContentVersion(mainImage, place.updated_at),
    images: Array.isArray(place.images)
      ? imagePaths.map((imagePath) =>
          withContentVersion(
            toAbsoluteAssetUrl(imagePath, STORAGE_BUCKETS.placeImages),
            place.updated_at
          )
        )
      : mainImage
      ? [withContentVersion(mainImage, place.updated_at)]
      : [],
    rating: Number(place.rating_average || 0),
  };
}

export function normalizeTripMember(member) {
  if (!member) {
    return null;
  }

  return {
    ...member,
    userId: member.user_id,
    invitedByUserId: member.invited_by_user_id,
    user: member.user ? normalizeUser(member.user) : null,
  };
}

export function normalizeTripPlace(tripPlace) {
  if (!tripPlace) {
    return null;
  }

  return {
    ...tripPlace,
    tripId: tripPlace.trip_id,
    placeId: tripPlace.place_id,
    visitDate: tripPlace.visit_date,
    visitStartTime: tripPlace.visit_start_time,
    visitEndTime: tripPlace.visit_end_time,
    orderIndex: tripPlace.order_index ?? 0,
    place: tripPlace.place ? normalizePlace(tripPlace.place) : null,
  };
}

export function normalizeTrip(trip) {
  if (!trip) {
    return null;
  }

  return {
    ...trip,
    ownerId: trip.owner_id || trip.owner_user_id,
    sharedNote: trip.shared_note || '',
    placesCount:
      trip.places_count ??
      (Array.isArray(trip.places) ? trip.places.length : 0),
    invitedUsersCount:
      trip.invited_users_count ??
      (Array.isArray(trip.members)
        ? trip.members.filter((member) => member && member.role !== 'owner').length
        : 0),
    members: Array.isArray(trip.members)
      ? trip.members.map(normalizeTripMember).filter(Boolean)
      : [],
    places: Array.isArray(trip.places)
      ? trip.places.map(normalizeTripPlace).filter(Boolean)
      : [],
  };
}
