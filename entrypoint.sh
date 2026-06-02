#!/bin/sh

mkdir -p /data/uploads/items

echo "Running database migrations..."

npx prisma migrate deploy

exec npm start