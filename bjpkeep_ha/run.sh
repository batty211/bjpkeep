#!/usr/bin/env bashio

set -e

# Configuration
export DATABASE_URL="file:/share/HAShare/bjpkeep/bjpkeep.db"
export UPLOAD_DIR="/share/HAShare/bjpkeep/uploads/items"

if bashio::config.has_value 'app_url'; then
    export NEXT_PUBLIC_APP_URL=$(bashio::config 'app_url')
    bashio::log.info "Setting APP URL to ${NEXT_PUBLIC_APP_URL}"
fi

# Check if HAShare is available
if [ ! -d "/share/HAShare" ]; then
    bashio::log.error "---------------------------------------------------------"
    bashio::log.error "ERROR: NAS Share '/share/HAShare' not found!"
    bashio::log.error "Please ensure 'HAShare' is correctly named and mounted."
    bashio::log.error "---------------------------------------------------------"
    exit 1
fi

# Ensure storage directories exist on the share
bashio::log.info "Ensuring storage directories exist on HAShare..."
mkdir -p /share/HAShare/bjpkeep/uploads/items

cd /app

bashio::log.info "Running database migrations..."
if ! npx prisma migrate deploy; then
    bashio::log.error "Prisma migration failed! Check if the database path is writable."
    exit 1
fi

# In Home Assistant Ingress, the token is dynamic. 
# We need to ensure that when the app starts, it knows its Ingress path.
# We set ASSET_PREFIX to an empty string here to let Next.js use relative paths
# which work better with the proxy.
export ASSET_PREFIX=""
export NODE_ENV=production
export HOSTNAME="0.0.0.0"

bashio::log.info "Starting BJP Keep in production mode..."

# Run next start and catch errors
if ! npx next start -H 0.0.0.0; then
    bashio::log.error "BJP Keep crashed!"
    exit 1
fi
