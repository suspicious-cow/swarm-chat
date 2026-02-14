FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS development
COPY . .
EXPOSE 8000

FROM base AS production
COPY . .
RUN pip install --no-cache-dir gunicorn
EXPOSE 8000
