from uuid import UUID


LANGUAGES = [
    {"code": "en", "name": "English"},
    {"code": "sq", "name": "Albanian"},
    {"code": "de", "name": "German"},
    {"code": "es", "name": "Spanish"},
    {"code": "it", "name": "Italian"},
    {"code": "fr", "name": "French"},
]

DEFAULT_ADMIN = {
    "first_name": "Admin",
    "last_name": "Drite",
    "email": "admin@example.com",
    "username": "admin",
    "password": "Admin1234!",
}

CATEGORY_IMAGE_MAP = {
    "restaurants": "assets/catimg/restaurant.jpg",
    "bars": "assets/catimg/bars.jpg",
    "cafes": "assets/catimg/cafe.jpg",
    "hotels": "assets/catimg/hotels.jpg",
    "beaches": "assets/catimg/beaches.jpg",
    "historical": "assets/catimg/historical.jpg",
    "hidden_gems": "assets/catimg/hiddengems.jpg",
    "government_help": "assets/catimg/governmentservices.jpg",
    "religious_sites": "assets/catimg/religious.jpg",
    "mosques": "assets/catimg/religious.jpg",
    "churches": "assets/catimg/religious.jpg",
    "clubs": "assets/catimg/bars.jpg",
}

CITY_METADATA = {
    "tirana": {"location_text": "Tirana, Albania", "latitude": 41.3275, "longitude": 19.8187, "description": "Albania's lively capital with cafes, culture, nightlife and city escapes.", "is_featured": True},
    "shkoder": {"location_text": "Shkodër, Albania", "latitude": 42.0683, "longitude": 19.5126, "description": "Historic northern city known for its culture, cycling and proximity to the Albanian Alps."},
    "vlore": {"location_text": "Vlorë, Albania", "latitude": 40.4661, "longitude": 19.4914, "description": "A coastal gateway where the Adriatic meets the Ionian Sea."},
    "durres": {"location_text": "Durrës, Albania", "latitude": 41.3231, "longitude": 19.4414, "description": "A seaside city with long beaches, Roman history and easy access from Tirana."},
    "ksamil": {"location_text": "Ksamil, Albania", "latitude": 39.7683, "longitude": 20.0012, "description": "A famous southern beach destination with turquoise water and small islands.", "is_featured": True},
    "dhermi": {"location_text": "Dhërmi, Albania", "latitude": 40.1492, "longitude": 19.6388, "description": "A Riviera hotspot known for beaches, nightlife and scenic mountain roads."},
    "lin": {"location_text": "Lin, Albania", "latitude": 41.0658, "longitude": 20.6447, "description": "A peaceful village on Lake Ohrid with quiet waterfront views."},
    "theth": {"location_text": "Theth, Albania", "latitude": 42.3959, "longitude": 19.7746, "description": "A mountain village famous for hiking, alpine landscapes and traditional guesthouses."},
    "gjirokaster": {"location_text": "Gjirokastër, Albania", "latitude": 40.0758, "longitude": 20.1389, "description": "A UNESCO stone city with Ottoman-era architecture and castle views."},
    "korca": {"location_text": "Korçë, Albania", "latitude": 40.6186, "longitude": 20.7808, "description": "A southeastern cultural center known for food, serenades and a relaxed city rhythm."},
    "berat": {"location_text": "Berat, Albania", "latitude": 40.7058, "longitude": 19.9522, "description": "The city of a thousand windows with layered history and riverside charm.", "is_featured": True},
    "lezhe": {"location_text": "Lezhë, Albania", "latitude": 41.7861, "longitude": 19.6461, "description": "A northern city that connects inland landmarks with nearby beaches and lagoons."},
    "shengjin": {"location_text": "Shëngjin, Albania", "latitude": 41.8131, "longitude": 19.5938, "description": "A growing beach destination on the northern coast."},
    "velipoje": {"location_text": "Velipojë, Albania", "latitude": 41.8632, "longitude": 19.4184, "description": "A wide sandy beach area near natural reserves and the Montenegro border."},
    "saranda": {"location_text": "Sarandë, Albania", "latitude": 39.8756, "longitude": 20.0049, "description": "A sunny Ionian city popular for beaches, promenades and day trips to the south.", "is_featured": True},
    "kruja": {"location_text": "Krujë, Albania", "latitude": 41.5092, "longitude": 19.7920, "description": "A hillside historic town known for Skanderbeg, its bazaar and castle."},
    "himare": {"location_text": "Himarë, Albania", "latitude": 40.1010, "longitude": 19.7447, "description": "A Riviera base for beautiful beaches, bays and laid-back coastal life."},
}


SEED_NAMESPACE = UUID("71a6fe2d-b040-4e7d-9c07-2d8073af49dc")
