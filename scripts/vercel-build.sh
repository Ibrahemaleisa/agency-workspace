#!/usr/bin/env sh
# Vercel build for every customer project.
# Migrations (and the optional demo seed) run only for Production deployments, so a Preview
# build of some branch can never change a customer's live database. Previews just build.
set -e

if [ "$VERCEL_ENV" = "production" ] || [ -z "$VERCEL_ENV" ]; then
  npx drizzle-kit migrate
  if [ "$SEED_DEMO" = "true" ]; then
    npx tsx src/db/seed.ts --if-empty
  fi
else
  echo "Skipping database migrations for a $VERCEL_ENV deployment."
fi

npx next build
