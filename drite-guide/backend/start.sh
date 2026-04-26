#!/bin/sh
set -eu

SKIP_BACKGROUND_DB_PREP=1 uvicorn app.main:app --host 0.0.0.0 --port 8080 &
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
