#!/bin/bash
# deploy.sh — Hub incremental deploy
# PHP changes: hot-copy (no rebuild, no downtime)
# Frontend changes: rebuild image + recreate container
# DB changes: --migrate flag

set -e
cd /opt/leymaken-hub
git pull origin master

echo "▶ Hot-copying backend files..."
docker cp backend/app/.        leymaken_hub_api:/var/www/html/app/
docker cp backend/config/.     leymaken_hub_api:/var/www/html/config/
docker cp backend/routes/.     leymaken_hub_api:/var/www/html/routes/
docker cp backend/database/.   leymaken_hub_api:/var/www/html/database/

echo "▶ Clearing Laravel caches..."
docker exec leymaken_hub_api php artisan optimize:clear

if [[ "$1" == "--migrate" ]]; then
  echo "▶ Running migrations..."
  docker exec leymaken_hub_api php artisan migrate --force
fi

echo "▶ Rebuilding frontend..."
docker compose -f docker/docker-compose.prod.yml build hub_frontend
docker compose -f docker/docker-compose.prod.yml up -d --force-recreate hub_frontend

echo "✓ Deploy complete"
