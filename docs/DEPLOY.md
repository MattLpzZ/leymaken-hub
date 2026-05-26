# LEYMAKEN HUB — Deploy Guide

## Prerequisites

- VPS Contabo with Docker + HestiaCP running
- `leymaken_net` Docker network exists: `docker network create leymaken_net` (or it already exists from other containers)
- `leymaken_mysql` container running with credentials

## Initial Deploy

```bash
# 1. Clone repo on VPS
ssh user@vps
cd /opt
git clone https://github.com/MattLpzZ/leymaken-hub.git
cd leymaken-hub

# 2. Configure environment
cp .env.example .env
nano .env  # Fill in APP_KEY, DB_PASSWORD, GITHUB_TOKEN, CLOUDFLARE_TOKEN, CLOUDFLARE_ACCOUNT_ID

# 3. Create DB
docker exec leymaken_mysql mysql -u leymaken -p<pass> -e \
  "CREATE DATABASE IF NOT EXISTS leymaken_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Build and start containers
docker compose -f docker/docker-compose.prod.yml build
docker compose -f docker/docker-compose.prod.yml up -d

# 5. Generate app key (if not set)
docker exec leymaken_hub_api php artisan key:generate

# 6. Run migrations
docker exec leymaken_hub_api php artisan migrate --force

# 7. Create admin user
docker exec -it leymaken_hub_api php artisan tinker
# Inside tinker: \App\Models\User::create(['name'=>'Matt','email'=>'salopzmatt@gmail.com','password'=>bcrypt('YOUR_PASSWORD')]);

# 8. Optimize Laravel
docker exec leymaken_hub_api php artisan optimize
```

## HestiaCP Proxy Setup

In HestiaCP, create web domain `hub.leymaken.com` and add to its nginx proxy config the contents of `docker/nginx/hub.leymaken.com.conf`.

## Incremental Updates (after git pull)

```bash
cd /opt/leymaken-hub
git pull

# If PHP files changed:
docker compose -f docker/docker-compose.prod.yml build hub_api hub_worker hub_scheduler
docker compose -f docker/docker-compose.prod.yml up -d --force-recreate hub_api hub_worker hub_scheduler
docker exec leymaken_hub_api php artisan migrate --force
docker exec leymaken_hub_api php artisan optimize
```

> **Note:** If PHP code changes aren't reflected after rebuild, the `app_code` volume may have stale content. Remove and recreate it:
> ```bash
> docker compose -f docker/docker-compose.prod.yml down
> docker volume rm leymaken-hub_app_code
> docker compose -f docker/docker-compose.prod.yml up -d
> ```

```bash
# If only frontend changed:
docker compose -f docker/docker-compose.prod.yml build hub_frontend
docker compose -f docker/docker-compose.prod.yml up -d --force-recreate hub_frontend
```

## Hot-deploy PHP files (urgent fixes without rebuild)

```bash
docker cp path/to/File.php leymaken_hub_api:/var/www/html/path/to/File.php
docker exec leymaken_hub_api kill -USR2 1
docker exec leymaken_hub_api php artisan optimize:clear
```
