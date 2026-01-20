#!/bin/bash
# Deploy Bunny.net Edge Script
# Usage: ./deploy.sh

# Configuration - set these as environment variables
BUNNY_API_KEY="${BUNNY_API_KEY}"
PULL_ZONE_ID="${BUNNY_PULL_ZONE_ID}"

if [ -z "$BUNNY_API_KEY" ]; then
    echo "Error: BUNNY_API_KEY environment variable not set"
    echo "Set it with: export BUNNY_API_KEY='your-api-key'"
    exit 1
fi

if [ -z "$PULL_ZONE_ID" ]; then
    echo "Error: BUNNY_PULL_ZONE_ID environment variable not set"
    echo "Set it with: export BUNNY_PULL_ZONE_ID='your-pull-zone-id'"
    exit 1
fi

# Read the Edge Script
SCRIPT_PATH="$(dirname "$0")/edge-script.js"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: edge-script.js not found at $SCRIPT_PATH"
    exit 1
fi

SCRIPT_CODE=$(cat "$SCRIPT_PATH")

echo "Deploying Edge Script to Pull Zone $PULL_ZONE_ID..."

# Escape the script code for JSON
SCRIPT_JSON=$(jq -Rs . < "$SCRIPT_PATH")

# Deploy via Bunny API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.bunny.net/pullzone/$PULL_ZONE_ID/edgerules/addOrUpdateEdgeRule" \
    -H "AccessKey: $BUNNY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"Code\": $SCRIPT_JSON, \"Enabled\": true}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Edge Script deployed successfully!"
    echo "$BODY" | jq .
else
    echo "❌ Deployment failed (HTTP $HTTP_CODE):"
    echo "$BODY"
    exit 1
fi
