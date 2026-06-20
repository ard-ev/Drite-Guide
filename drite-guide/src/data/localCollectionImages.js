const CATEGORY_IMAGES = {
  cat_000001: require('../../assets/catimg/hotels.jpg'),
  cat_000002: require('../../assets/catimg/restaurant.jpg'),
  cat_000003: require('../../assets/catimg/beaches.jpg'),
  cat_000004: require('../../assets/catimg/bars.jpg'),
  cat_000005: require('../../assets/catimg/cafe.jpg'),
  cat_000006: require('../../assets/catimg/historical.jpg'),
  cat_000007: require('../../assets/catimg/hiddengems.jpg'),
  cat_000008: require('../../assets/catimg/governmentservices.jpg'),
  cat_000009: require('../../assets/catimg/religious.jpg'),
};

const CITY_IMAGES = {
  cty_000001: require('../../assets/cities/tirana.jpg'),
  cty_000002: require('../../assets/cities/shkoder.jpg'),
  cty_000003: require('../../assets/cities/vlore.jpg'),
  cty_000004: require('../../assets/cities/durres.jpg'),
  cty_000005: require('../../assets/cities/ksamil.jpg'),
  cty_000006: require('../../assets/cities/dhermi.jpg'),
  cty_000007: require('../../assets/cities/lin.jpg'),
  cty_000008: require('../../assets/cities/theth.jpg'),
  cty_000009: require('../../assets/cities/gjirokaster.jpg'),
  cty_000010: require('../../assets/cities/korca.jpg'),
  cty_000011: require('../../assets/cities/berat.jpg'),
  cty_000012: require('../../assets/cities/lezhe.jpg'),
  cty_000013: require('../../assets/cities/lezhe.jpg'),
  cty_000014: require('../../assets/cities/lezhe.jpg'),
  cty_000015: require('../../assets/cities/lezhe.jpg'),
  cty_000016: require('../../assets/cities/kruja.jpg'),
  cty_000017: require('../../assets/cities/lezhe.jpg'),
};

export function getLocalCategoryImage(categoryId) {
  return CATEGORY_IMAGES[categoryId] || null;
}

export function getLocalCityImage(cityId) {
  return CITY_IMAGES[cityId] || null;
}
