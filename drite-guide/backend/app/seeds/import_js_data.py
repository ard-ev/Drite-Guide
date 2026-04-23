import ast
import re
import shutil
import uuid
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.init_db import ensure_upload_directories
from app.models.category import Category, CategoryTranslation
from app.models.city import City, CityTranslation
from app.models.language import Language
from app.models.place import Place, PlaceImage, PlaceTranslation
from app.models.user import User, UserRole
from app.seeds.seed_data import CATEGORY_IMAGE_MAP, CITY_METADATA, DEFAULT_ADMIN, LANGUAGES, SEED_NAMESPACE


BASE_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
UPLOADS_ROOT = Path(settings.UPLOAD_DIR)


def deterministic_uuid(entity_type: str, legacy_id: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, f"{entity_type}:{legacy_id}")


def ensure_svg_placeholders() -> None:
    placeholders = {
        UPLOADS_ROOT / "profile_pictures" / "default-profile.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><rect width='100%' height='100%' fill='#E5E7EB'/><circle cx='160' cy='120' r='60' fill='#9CA3AF'/><rect x='70' y='210' width='180' height='70' rx='35' fill='#9CA3AF'/></svg>",
        UPLOADS_ROOT / "places" / "placeholder.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#D6E4F0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#1F2937'>Drite Guide Place</text></svg>",
        UPLOADS_ROOT / "cities" / "placeholder.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#F2E8DC'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#1F2937'>Drite Guide City</text></svg>",
        UPLOADS_ROOT / "categories" / "placeholder.svg": "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#E7F3E8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#1F2937'>Drite Guide Category</text></svg>",
    }
    for path, content in placeholders.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text(content, encoding="utf-8")


def extract_export_array(file_path: Path, export_name: str) -> str:
    content = file_path.read_text(encoding="utf-8")
    marker = f"export const {export_name} = ["
    start = content.find(marker)
    if start == -1:
        raise ValueError(f"Export '{export_name}' not found in {file_path}")
    array_start = content.find("[", start)
    depth = 0
    in_string = False
    quote_char = ""
    escaped = False
    for index in range(array_start, len(content)):
        char = content[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote_char:
                in_string = False
        else:
            if char in {"'", '"'}:
                in_string = True
                quote_char = char
            elif char == "[":
                depth += 1
            elif char == "]":
                depth -= 1
                if depth == 0:
                    return content[array_start : index + 1]
    raise ValueError(f"Could not parse export '{export_name}'")


def parse_simple_object_array(array_text: str) -> list[dict]:
    normalized = re.sub(r"(\w+)\s*:", r'"\1":', array_text)
    normalized = normalized.replace("'", '"')
    normalized = re.sub(r",\s*}", "}", normalized)
    normalized = re.sub(r",\s*]", "]", normalized)
    return ast.literal_eval(normalized)


def parse_image_value(value: str | None) -> str | None:
    if not value:
        return None
    require_match = re.search(r"require\('([^']+)'\)", value)
    if require_match:
        return require_match.group(1)
    string_match = re.search(r"'([^']+)'", value)
    if string_match:
        return string_match.group(1)
    return None


def copy_local_asset(source: str | None, folder: str, fallback_relative_path: str) -> str:
    if not source:
        return fallback_relative_path
    if source.startswith("http://") or source.startswith("https://"):
        return fallback_relative_path

    absolute_source = (PROJECT_ROOT / source.replace("../../", "")).resolve()
    if not absolute_source.exists():
        return fallback_relative_path

    destination_name = f"{uuid.uuid5(SEED_NAMESPACE, str(absolute_source))}{absolute_source.suffix.lower()}"
    destination = UPLOADS_ROOT / folder / destination_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        shutil.copy2(absolute_source, destination)
    return f"uploads/{folder}/{destination_name}"


def load_categories() -> list[dict]:
    return parse_simple_object_array(extract_export_array(DATA_DIR / "categories.js", "categories"))


def load_cities() -> list[dict]:
    array_text = extract_export_array(DATA_DIR / "cities.js", "cities")
    city_objects = re.findall(r"\{(.*?)\}", array_text, re.DOTALL)
    cities = []
    for raw in city_objects:
        city_id = re.search(r"id\s*:\s*'([^']+)'", raw)
        name = re.search(r"name\s*:\s*'([^']+)'", raw)
        image = re.search(r"image\s*:\s*(.+?)(?:,\s*\n|\n)", raw, re.DOTALL)
        if city_id and name:
            cities.append({"id": city_id.group(1), "name": name.group(1), "image": parse_image_value(image.group(1)) if image else None})
    return cities


def load_places() -> list[dict]:
    array_text = extract_export_array(DATA_DIR / "places.js", "places")
    place_objects = re.findall(r"\{(.*?)\}", array_text, re.DOTALL)
    places: list[dict] = []
    for raw in place_objects:
        if "cityId:" not in raw or "categoryId:" not in raw:
            continue
        item: dict[str, object] = {}
        for key in ["id", "cityId", "categoryId", "name", "description", "address", "googleMapsLink", "phone", "website"]:
            match = re.search(rf"{key}\s*:\s*'([^']*)'", raw)
            item[key] = match.group(1) if match else None
        for key in ["rating", "latitude", "longitude"]:
            match = re.search(rf"{key}\s*:\s*(-?\d+(?:\.\d+)?)", raw)
            item[key] = float(match.group(1)) if match else None
        image = re.search(r"image\s*:\s*(.+?)(?:,\s*\n|\n)", raw, re.DOTALL)
        images = re.search(r"images\s*:\s*\[(.*?)\]", raw, re.DOTALL)
        item["image"] = parse_image_value(image.group(1)) if image else None
        item["images"] = [parse_image_value(match.group(0)) for match in re.finditer(r"(?:require\('([^']+)'\)|'([^']+)')", images.group(1) if images else "")]
        item["images"] = [image_path for image_path in item["images"] if image_path]
        places.append(item)
    return places


def seed_languages(session: Session) -> None:
    for language_data in LANGUAGES:
        language = session.get(Language, language_data["code"])
        if language is None:
            session.add(Language(**language_data))
        else:
            language.name = language_data["name"]
            language.is_active = True


def seed_default_admin(session: Session) -> None:
    admin = session.scalar(
        select(User).where(
            (User.email == DEFAULT_ADMIN["email"]) | (User.username == DEFAULT_ADMIN["username"])
        )
    )
    if admin is None:
        admin = User(
            id=deterministic_uuid("user", "default-admin"),
            first_name=DEFAULT_ADMIN["first_name"],
            last_name=DEFAULT_ADMIN["last_name"],
            email=DEFAULT_ADMIN["email"],
            username=DEFAULT_ADMIN["username"],
            password_hash=hash_password(DEFAULT_ADMIN["password"]),
            role=UserRole.admin,
            preferred_language="en",
            email_verified=True,
            profile_picture_path="uploads/profile_pictures/default-profile.svg",
        )
        session.add(admin)
    else:
        admin.first_name = DEFAULT_ADMIN["first_name"]
        admin.last_name = DEFAULT_ADMIN["last_name"]
        admin.email = DEFAULT_ADMIN["email"]
        admin.username = DEFAULT_ADMIN["username"]
        admin.password_hash = hash_password(DEFAULT_ADMIN["password"])
        admin.role = UserRole.admin
        admin.preferred_language = "en"
        admin.email_verified = True
        admin.profile_picture_path = "uploads/profile_pictures/default-profile.svg"


def seed_categories(session: Session) -> dict[str, uuid.UUID]:
    seeded_ids: dict[str, uuid.UUID] = {}
    for item in load_categories():
        category_uuid = deterministic_uuid("category", item["id"])
        image_source = CATEGORY_IMAGE_MAP.get(item["id"])
        image_path = copy_local_asset(image_source, "categories", "uploads/categories/placeholder.svg")
        category = session.get(Category, category_uuid)
        if category is None:
            category = Category(id=category_uuid, name=item["name"], image_path=image_path)
            session.add(category)
        else:
            category.name = item["name"]
            category.image_path = image_path
        translation = session.scalar(
            select(CategoryTranslation).where(
                CategoryTranslation.category_id == category_uuid,
                CategoryTranslation.language_code == "en",
            )
        )
        if translation is None:
            session.add(CategoryTranslation(category_id=category_uuid, language_code="en", name=item["name"]))
        else:
            translation.name = item["name"]
        seeded_ids[item["id"]] = category_uuid
    return seeded_ids


def seed_cities(session: Session) -> dict[str, uuid.UUID]:
    seeded_ids: dict[str, uuid.UUID] = {}
    for item in load_cities():
        meta = CITY_METADATA.get(item["id"], {})
        city_uuid = deterministic_uuid("city", item["id"])
        image_path = copy_local_asset(item.get("image"), "cities", "uploads/cities/placeholder.svg")
        city = session.get(City, city_uuid)
        base_payload = {
            "city_name": item["name"],
            "image_path": image_path,
            "hero_image_path": image_path,
            "location_text": meta.get("location_text", f"{item['name']}, Albania"),
            "latitude": meta.get("latitude", 0.0),
            "longitude": meta.get("longitude", 0.0),
            "description": meta.get("description", f"Travel inspiration for {item['name']}."),
            "is_featured": meta.get("is_featured", False),
        }
        if city is None:
            city = City(id=city_uuid, **base_payload)
            session.add(city)
        else:
            for key, value in base_payload.items():
                setattr(city, key, value)
        translation = session.scalar(
            select(CityTranslation).where(CityTranslation.city_id == city_uuid, CityTranslation.language_code == "en")
        )
        if translation is None:
            session.add(
                CityTranslation(
                    city_id=city_uuid,
                    language_code="en",
                    city_name=item["name"],
                    description=base_payload["description"],
                )
            )
        else:
            translation.city_name = item["name"]
            translation.description = base_payload["description"]
        seeded_ids[item["id"]] = city_uuid
    return seeded_ids


def seed_places(session: Session, category_ids: dict[str, uuid.UUID], city_ids: dict[str, uuid.UUID]) -> None:
    for item in load_places():
        if item["categoryId"] not in category_ids or item["cityId"] not in city_ids:
            continue
        place_uuid = deterministic_uuid("place", item["id"])
        main_image_path = copy_local_asset(item.get("image"), "places", "uploads/places/placeholder.svg")
        place = session.get(Place, place_uuid)
        payload = {
            "category_id": category_ids[item["categoryId"]],
            "city_id": city_ids[item["cityId"]],
            "name": item["name"],
            "description": item["description"] or f"Travel note for {item['name']}.",
            "address": item["address"] or "Address not provided",
            "google_maps_link": item["googleMapsLink"] or "https://maps.google.com",
            "latitude": item["latitude"] or 0.0,
            "longitude": item["longitude"] or 0.0,
            "main_image_path": main_image_path,
            "phone": item["phone"] or None,
            "website": item["website"] or None,
            "rating_average": item["rating"] or 0,
            "ratings_count": 1 if item["rating"] else 0,
        }
        if place is None:
            place = Place(id=place_uuid, **payload)
            session.add(place)
        else:
            for key, value in payload.items():
                setattr(place, key, value)
        translation = session.scalar(
            select(PlaceTranslation).where(PlaceTranslation.place_id == place_uuid, PlaceTranslation.language_code == "en")
        )
        if translation is None:
            session.add(
                PlaceTranslation(
                    place_id=place_uuid,
                    language_code="en",
                    name=payload["name"],
                    description=payload["description"],
                )
            )
        else:
            translation.name = payload["name"]
            translation.description = payload["description"]

        existing_images = {image.sort_order: image for image in place.images}
        for sort_order, raw_image in enumerate(item.get("images", [])):
            image_path = copy_local_asset(raw_image, "places", "uploads/places/placeholder.svg")
            if sort_order in existing_images:
                existing_images[sort_order].image_path = image_path
            else:
                place.images.append(PlaceImage(image_path=image_path, sort_order=sort_order))


def run() -> None:
    ensure_upload_directories()
    ensure_svg_placeholders()
    engine = create_engine(settings.SYNC_DATABASE_URL, future=True)
    Base.metadata.create_all(bind=engine)
    SessionFactory = sessionmaker(bind=engine, future=True)

    with SessionFactory() as session:
        seed_languages(session)
        seed_default_admin(session)
        category_ids = seed_categories(session)
        city_ids = seed_cities(session)
        seed_places(session, category_ids, city_ids)
        session.commit()

    print("Seeds completed successfully.")


if __name__ == "__main__":
    run()
