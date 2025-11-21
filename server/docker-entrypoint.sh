#!/bin/sh

# Prisma Actions

echo "Server Entrypoint Script Started"

npx prisma generate

echo "Prisma Client Generated, Starting Migrations"
npx prisma migrate deploy

echo "Migrations Applied, Starting the Server"
exec "$@"