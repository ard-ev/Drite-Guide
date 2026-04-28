import { toAbsoluteAssetUrl } from '../config/api';

export function normalizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    ...category,
    id: category.id,
    legacyId: category.id,
    image: toAbsoluteAssetUrl(category.image_path),
  };
}

export function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    profile_picture_path: toAbsoluteAssetUrl(user.profile_picture_path),
  };
}

export function normalizeCity(city) {
  if (!city) {
    return null;
  }

  return {
    ...city,
    id: city.id,
    legacyId: city.id,
    name: city.city_name,
    image: toAbsoluteAssetUrl(city.image_path),
    heroImage: toAbsoluteAssetUrl(city.hero_image_path),
  };
}

export function normalizePlace(place, options = {}) {
  if (!place) {
    return null;
  }

  const mainImage = toAbsoluteAssetUrl(place.main_image_path);

  return {
    ...place,
    id: place.id,
    legacyId: place.id,
    cityId: place.city_id,
    categoryId: place.category_id,
    cityName: options.cityName || '',
    categoryName: options.categoryName || '',
    image: mainImage,
    images: Array.isArray(place.images)
      ? place.images.map((item) => toAbsoluteAssetUrl(item.image_path))
      : mainImage
      ? [mainImage]
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
