from fastapi import APIRouter

from app.api.v1.endpoints import auth, categories, cities, languages, places, reviews, saved_places, search_history, trips, users


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(languages.router, prefix="/languages", tags=["languages"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(cities.router, prefix="/cities", tags=["cities"])
api_router.include_router(places.router, prefix="/places", tags=["places"])
api_router.include_router(saved_places.router, prefix="/saved-places", tags=["saved-places"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(search_history.router, prefix="/search-history", tags=["search-history"])

