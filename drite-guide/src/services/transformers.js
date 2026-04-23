import { toAbsoluteAssetUrl } from '../config/api';

export function normalizeCategory(category) {
  return {
    ...category,
    id: category.id,
    legacyId: category.id,
    image: toAbsoluteAssetUrl(category.image_path),
  };
}

export function normalizeUser(user) {
  return {
    ...user,
    profile_picture_path: toAbsoluteAssetUrl(user.profile_picture_path),
  };
}

export function normalizeCity(city) {
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
