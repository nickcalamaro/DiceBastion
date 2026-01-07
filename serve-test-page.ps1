# Simple HTTP server for testing the auto-renewal page
# Run this and open http://localhost:8000/test-auto-renewal-purchase.html

Write-Host "Starting local HTTP server on port 8000..." -ForegroundColor Green
Write-Host "Open: http://localhost:8000/test-auto-renewal-purchase.html" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Python simple HTTP server
python -m http.server 8000
