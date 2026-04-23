from app.models.category import Category
from app.models.city import City
from app.models.place import Place
from app.schemas.category import CategoryRead
from app.schemas.city import CityRead
from app.schemas.place import PlaceImageRead, PlaceRead
from app.services.i18n import translate_value


def serialize_category(category: Category, language_code: str) -> CategoryRead:
    return CategoryRead(
        id=category.id,
        name=translate_value(category.translations, language_code, "name", category.name),
        image_path=category.image_path,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


def serialize_city(city: City, language_code: str) -> CityRead:
    return CityRead(
        id=city.id,
        city_name=translate_value(city.translations, language_code, "city_name", city.city_name),
        image_path=city.image_path,
        hero_image_path=city.hero_image_path,
        location_text=city.location_text,
        latitude=city.latitude,
        longitude=city.longitude,
        description=translate_value(city.translations, language_code, "description", city.description),
        is_featured=city.is_featured,
        created_at=city.created_at,
        updated_at=city.updated_at,
    )


def serialize_place(place: Place, language_code: str) -> PlaceRead:
    return PlaceRead(
        id=place.id,
        category_id=place.category_id,
        city_id=place.city_id,
        name=translate_value(place.translations, language_code, "name", place.name),
        description=translate_value(place.translations, language_code, "description", place.description),
        address=place.address,
        google_maps_link=place.google_maps_link,
        latitude=place.latitude,
        longitude=place.longitude,
        main_image_path=place.main_image_path,
        phone=place.phone,
        website=place.website,
        opening_hours=place.opening_hours,
        rating_average=float(place.rating_average or 0),
        ratings_count=place.ratings_count,
        is_featured=place.is_featured,
        images=[
            PlaceImageRead(id=image.id, image_path=image.image_path, sort_order=image.sort_order)
            for image in sorted(place.images, key=lambda item: item.sort_order)
        ],
        created_at=place.created_at,
        updated_at=place.updated_at,
    )
