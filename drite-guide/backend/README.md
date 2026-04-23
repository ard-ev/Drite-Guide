# Drite Guide Backend

Produktionsnahe Backend-Basis für die Dritë Guide App mit:

- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- JWT Auth mit Access- und Refresh-Tokens
- Rollen (`admin`, `user`)
- E-Mail-Verifizierung
- lokale Bildspeicherung
- i18n-Translationstabellen
- Seeds für Sprachen, Default-Admin und Import aus den bestehenden JS-Dateien

## Struktur

```text
backend/
  app/
    api/
    core/
    crud/
    db/
    models/
    schemas/
    services/
    seeds/
    uploads/
    utils/
    main.py
  alembic/
  alembic.ini
  requirements.txt
  .env.example
```

## 1. Virtuelle Umgebung

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

## 2. Abhängigkeiten installieren

```powershell
pip install -r requirements.txt
```

## 3. Umgebungsvariablen anlegen

```powershell
Copy-Item .env.example .env
```

Danach `DATABASE_URL`, `SYNC_DATABASE_URL` und `SECRET_KEY` anpassen.

## 4. PostgreSQL vorbereiten

Beispiel:

```sql
CREATE DATABASE drite_guide;
```

## 5. Migrationen ausführen

```powershell
alembic upgrade head
```

## 6. Seeds ausführen

Das Seed-System erledigt:

- Sprachen (`en`, `sq`, `de`, `es`, `it`, `fr`)
- Default-Admin für lokale Entwicklung
- Import aus `src/data/categories.js`
- Import aus `src/data/cities.js`
- Import aus `src/data/places.js`

```powershell
python -m app.seeds.import_js_data
```

Lokaler Default-Admin:

- Email: `admin@drite-guide.local`
- Username: `admin`
- Passwort: `Admin1234!`

## 7. API starten

```powershell
uvicorn app.main:app --reload
```

Docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/api/v1/openapi.json`

## Wichtige Endpunkte

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/verify-email`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/profile-picture`
- `PATCH /api/v1/users/me/language`
- `GET /api/v1/languages`
- `GET|POST|PATCH|DELETE /api/v1/categories`
- `GET|POST|PATCH|DELETE /api/v1/cities`
- `GET|POST|PATCH|DELETE /api/v1/places`
- `POST /api/v1/places/{id}/images`
- `DELETE /api/v1/places/{id}/images/{image_id}`
- `GET|POST|PATCH|DELETE /api/v1/saved-places`
- `GET|POST|PATCH|DELETE /api/v1/trips`
- `POST /api/v1/trips/{id}/invite-by-username`
- `GET /api/v1/trips/{id}/members`
- `POST|PATCH|DELETE /api/v1/trips/{id}/places`
- `PATCH /api/v1/trips/{id}/places/reorder`
- `GET /api/v1/places/{id}/reviews`
- `POST /api/v1/places/{id}/reviews`
- `PATCH|DELETE /api/v1/reviews/{id}`
- `GET|POST|DELETE /api/v1/search-history`

## i18n-Logik

Die Sprachauflösung folgt:

1. `Accept-Language` Header
2. gespeicherte User-Sprache
3. Fallback `en`

Für übersetzte Inhalte gilt:

1. gewünschte Sprache
2. Englisch
3. Originalwert aus Haupttabelle

## Daten-Inkonsistenzen aus den JS-Dateien

Beim Import werden einige Lücken bewusst abgefedert:

- `categories.js` enthält keine Bildpfade, deshalb werden sie auf bekannte Assets gemappt.
- `cities.js` enthält keine Beschreibungen, Hero-Bilder und teilweise keine eigenständigen Bilddateien für jeden Ort. Dafür nutzt der Seed gepflegte Metadaten und lokale Placeholder/Fallbacks.
- `places.js` mischt lokale Assets mit externen Placeholder-URLs. Externe URLs werden beim Seed auf lokale SVG-Placeholders gemappt, damit die Speicherarchitektur lokal bleibt.

## Hinweise

- E-Mail-Versand ist als Service gekapselt. Im Development wird der Verifizierungslink geloggt.
- Uploads werden lokal unter `app/uploads/` gespeichert und statisch unter `/uploads/...` ausgeliefert.
- Das Recommendation-Fundament ist vorbereitet über `saved_places`, `reviews` und `search_history`.
