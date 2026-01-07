# Set INTERNAL_SECRET for Main Worker
# This must match the same secret in the payments worker!

Write-Host "`n=== Setting INTERNAL_SECRET for Main Worker ===" -ForegroundColor Cyan
Write-Host "IMPORTANT: Use the SAME value you used for the payments worker!" -ForegroundColor Yellow
Write-Host ""

# Set the secret
npx wrangler secret put INTERNAL_SECRET

Write-Host "`n=== Verifying Secret Was Set ===" -ForegroundColor Cyan
npx wrangler secret list

Write-Host "`nDone! Now deploy the main worker with: npx wrangler deploy" -ForegroundColor Green
