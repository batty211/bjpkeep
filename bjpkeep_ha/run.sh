#!/usr/bin/env bashio

set -e

# Configuration
export DATABASE_URL="file:/data/bjpkeep.db"
export UPLOAD_DIR="/data/uploads/items"

if bashio::config.has_value 'app_url'; then
    export NEXT_PUBLIC_APP_URL=$(bashio::config 'app_url')
    bashio::log.info "Setting APP URL to ${NEXT_PUBLIC_APP_URL}"
fi

# Ensure upload directory exists
mkdir -p /data/uploads/items

cd /app

bashio::log.info "Running database migrations..."
npx prisma migrate deploy

bashio::log.info "Starting BJP Keep..."
export HOSTNAME="0.0.0.0"
exec npm start -- -H 0.0.0.0