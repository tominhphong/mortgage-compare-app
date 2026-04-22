#!/usr/bin/env bash
# Run this once after cloning to install deps and verify types
set -e

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Type-checking..."
npx tsc --noEmit

echo "Done. Next steps:"
echo "  1. Create D1: npx wrangler d1 create mortgage-compare-db"
echo "  2. Paste database_id into wrangler.toml"
echo "  3. Apply schema: npx wrangler d1 execute mortgage-compare-db --file=src/schema.sql"
echo "  4. Create R2: npx wrangler r2 bucket create mortgage-compare-reports"
echo "  5. Deploy: npm run deploy"
