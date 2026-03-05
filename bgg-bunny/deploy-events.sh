#!/bin/bash

# Deploy Events Edge Script to Bunny.net
# 
# This script deploys the Events API edge script which handles:
# - Event CRUD API endpoints
# - Dynamic event pages with SEO
# - Shareable event URLs

echo "🚀 Deploying Events Edge Script to Bunny.net..."

# Configuration
SCRIPT_NAME="DiceBastionEvents"
SCRIPT_FILE="events-edge-script.ts"
PULL_ZONE_ID="${BUNNY_PULL_ZONE_ID}"
API_KEY="${BUNNY_API_KEY}"

if [ -z "$PULL_ZONE_ID" ]; then
    echo "❌ Error: BUNNY_PULL_ZONE_ID environment variable not set"
    echo "Please set it with: export BUNNY_PULL_ZONE_ID='your-pull-zone-id'"
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo "❌ Error: BUNNY_API_KEY environment variable not set"
    echo "Please set it with: export BUNNY_API_KEY='your-api-key'"
    exit 1
fi

# Check if script file exists
if [ ! -f "$SCRIPT_FILE" ]; then
    echo "❌ Error: $SCRIPT_FILE not found"
    exit 1
fi

echo "📝 Reading script file..."
SCRIPT_CONTENT=$(cat "$SCRIPT_FILE")

echo "📤 Uploading to Bunny.net..."

# API endpoint for edge scripts
API_URL="https://api.bunny.net/pullzone/$PULL_ZONE_ID/edgerules/addorupdate"

# Create temporary JSON file
cat > /tmp/bunny-payload.json <<EOF
{
  "Guid": "$(uuidgen)",
  "ActionType": 13,
  "TriggerMatchingType": 0,
  "Description": "Events API & Dynamic Pages",
  "Enabled": true,
  "ActionParameter1": $(echo "$SCRIPT_CONTENT" | jq -Rs .),
  "Triggers": [
    {
      "Type": 0,
      "PatternMatches": ["/events/*", "/api/events*"],
      "PatternMatchingType": 0,
      "Parameter1": ""
    }
  ]
}
EOF

# Deploy using curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "AccessKey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/bunny-payload.json)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

rm /tmp/bunny-payload.json

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Events Edge Script deployed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Verify environment variables in Bunny.net dashboard:"
    echo "   - BUNNY_DATABASE_URL"
    echo "   - BUNNY_DATABASE_AUTH_TOKEN"
    echo "   - ADMIN_API_KEY"
    echo "   - SITE_URL"
    echo ""
    echo "2. Run database migration:"
    echo "   See migrations/0004_add_event_slugs.sql"
    echo ""
    echo "3. Test the deployment:"
    echo "   curl https://dicebastion.co.uk/api/events"
    echo ""
    echo "📖 Full documentation: EVENTS_API_README.md"
else
    echo "❌ Deployment failed! HTTP Code: $HTTP_CODE"
    echo "$RESPONSE" | head -n -1
    exit 1
fi
