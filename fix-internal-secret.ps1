# Fix INTERNAL_SECRET - Set Same Secret in Both Workers

Write-Host "`n=== INTERNAL_SECRET Mismatch Detected ===" -ForegroundColor Red
Write-Host "The main worker has a secret with length 4 (too short!)" -ForegroundColor Yellow
Write-Host "We need to set a STRONG secret in BOTH workers with the EXACT SAME VALUE" -ForegroundColor Yellow

Write-Host "`n=== Generating a secure secret ===" -ForegroundColor Cyan
$newSecret = [System.Guid]::NewGuid().ToString("N")
Write-Host "Generated secret: " -NoNewline
Write-Host $newSecret -ForegroundColor Green
Write-Host "(Copy this value - you'll need it twice!)" -ForegroundColor Yellow

Write-Host "`n=== Step 1: Set secret in MAIN worker ===" -ForegroundColor Cyan
Write-Host "Run this command and paste the secret above when prompted:" -ForegroundColor White
Write-Host "  cd c:\Users\nickc\Desktop\Dev\DiceBastion" -ForegroundColor Gray
Write-Host "  npx wrangler secret put INTERNAL_SECRET" -ForegroundColor Gray

Write-Host "`n=== Step 2: Set secret in PAYMENTS worker ===" -ForegroundColor Cyan
Write-Host "Run this command and paste the SAME secret when prompted:" -ForegroundColor White
Write-Host "  cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker" -ForegroundColor Gray
Write-Host "  npx wrangler secret put INTERNAL_SECRET" -ForegroundColor Gray

Write-Host "`n=== Step 3: Deploy both workers ===" -ForegroundColor Cyan
Write-Host "Main worker:" -ForegroundColor White
Write-Host "  cd c:\Users\nickc\Desktop\Dev\DiceBastion" -ForegroundColor Gray
Write-Host "  npx wrangler deploy" -ForegroundColor Gray
Write-Host "Payments worker:" -ForegroundColor White
Write-Host "  cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker" -ForegroundColor Gray
Write-Host "  npx wrangler deploy" -ForegroundColor Gray

Write-Host "`n=== Important ===" -ForegroundColor Red
Write-Host "The secret MUST be EXACTLY the same in both workers!" -ForegroundColor Yellow
Write-Host "Save the secret above in a secure location." -ForegroundColor White

# Save to file for reference
$newSecret | Out-File -FilePath "INTERNAL_SECRET_VALUE.txt" -NoNewline
Write-Host "`n✅ Secret saved to: INTERNAL_SECRET_VALUE.txt" -ForegroundColor Green
Write-Host "Keep this file secure and don't commit it to git!" -ForegroundColor Yellow
