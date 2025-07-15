#!/bin/bash

APP_DIR="/var/www/gallotta.fr/aarchive"
PM2_NAME="aarchive"

echo "🚀 [Deploy] Go to app directory"
cd $APP_DIR || exit

echo "🔄 [Git] Pull latest code"
git pull origin master

echo "🛠 [Prisma] Apply migrations"
npx prisma migrate deploy

echo "🔧 [Prisma] Generate client"
npx prisma generate

echo "🏗 [Next.js] Build project"
npm run build

echo "🚦 [PM2] Restart app"
pm2 restart $PM2_NAME

echo "✅ [Deploy] Done!"
