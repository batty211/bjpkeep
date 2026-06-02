#!/bin/sh

mkdir -p /data/uploads/items

if [ ! -f /data/bjpkeep.db ]; then
  echo "Initializing database..."
  npx prisma db push
fi

exec npm start