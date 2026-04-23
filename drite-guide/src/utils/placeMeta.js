export function getCategoryLabel(categoryId, categoryName) {
  if (categoryName) {
    return categoryName;
  }

  const categoryLabels = {
    restaurants: 'Restaurant',
    cafes: 'Cafe',
    bars: 'Bar',
    hotels: 'Hotel',
    beaches: 'Beach',
    historical: 'Historical Site',
    hidden_gems: 'Hidden Gem',
    hiddengems: 'Hidden Gem',
    religious_sites: 'Religious Sites',
    religioussites: 'Religious Sites',
    mosques: 'Religious Sites',
    churches: 'Religious Sites',
    museums: 'Museum',
    bunkers: 'Bunker',
    adventures: 'Adventure',
    government_help: 'Government Help',
    governmenthelp: 'Government Help',
    governmentservices: 'Government Service',
    clubs: 'Club',
  };

  return categoryLabels[categoryId] || categoryId || 'Place';
}

export function getImageSource(image) {
  if (!image) {
    return { uri: 'https://placehold.co/1200x800/E5E7EB/222222?text=No+Image' };
  }

  if (typeof image === 'string') {
    return { uri: image };
  }

  return image;
}
