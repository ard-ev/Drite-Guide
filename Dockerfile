FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY drite-guide/backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY drite-guide/backend /app/backend
COPY drite-guide/src/data /app/src/data
RUN sed -i 's/\r$//' /app/backend/start.sh

WORKDIR /app/backend

EXPOSE 8080

CMD ["sh", "start.sh"]
