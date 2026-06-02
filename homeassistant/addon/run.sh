#!/usr/bin/with-contenv bashio

set -e

cd /app

echo "Starting BJP Keep..."

npx prisma migrate deploy || true

npm start