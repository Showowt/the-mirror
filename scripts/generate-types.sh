#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# THE MIRROR v3 — GENERATE TYPESCRIPT TYPES FROM SUPABASE
# Run after any schema changes
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Generating TypeScript types from Supabase schema...${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}Error: .env.local not found${NC}"
  echo "Please create .env.local with NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

# Extract project ID from Supabase URL
source .env.local
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local${NC}"
  exit 1
fi

PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/(.+)\.supabase\.co/\1/')

echo -e "Project ID: ${GREEN}$PROJECT_ID${NC}"

# Generate types
npx supabase gen types typescript \
  --project-id "$PROJECT_ID" \
  > src/lib/supabase/database.types.generated.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Types generated successfully${NC}"
  echo -e "File: ${GREEN}src/lib/supabase/database.types.generated.ts${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "1. Review the generated types"
  echo "2. Update src/lib/supabase/types.ts if needed"
  echo "3. Run 'npm run build' to verify TypeScript compiles"
else
  echo -e "${RED}✗ Type generation failed${NC}"
  echo "Make sure you have Supabase CLI installed:"
  echo "  npm install -g supabase"
  exit 1
fi
