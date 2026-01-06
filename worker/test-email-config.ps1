# Test Email Configuration
# Run this script to check if your MailerSend API key is properly configured

Write-Host "🔍 Checking Cloudflare Worker Email Configuration..." -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is installed
if (!(Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Wrangler CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 1: Checking secrets..." -ForegroundColor Yellow
Write-Host ""

# List secrets (doesn't show values, just names)
Write-Host "Running: wrangler secret list" -ForegroundColor Gray
$secrets = wrangler secret list 2>&1 | Out-String

if ($secrets -match "MAILERSEND_API_KEY") {
    Write-Host "✅ MAILERSEND_API_KEY is set as a secret" -ForegroundColor Green
} else {
    Write-Host "❌ MAILERSEND_API_KEY is NOT set as a secret" -ForegroundColor Red
    Write-Host ""
    Write-Host "   To fix this, run:" -ForegroundColor Yellow
    Write-Host "   wrangler secret put MAILERSEND_API_KEY" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Then paste your MailerSend API key when prompted." -ForegroundColor Gray
    Write-Host "   Get your API key from: https://app.mailersend.com/" -ForegroundColor Gray
    Write-Host ""
}

if ($secrets -match "SUMUP_CLIENT_ID") {
    Write-Host "✅ SUMUP_CLIENT_ID is set" -ForegroundColor Green
} else {
    Write-Host "⚠️  SUMUP_CLIENT_ID is NOT set" -ForegroundColor Yellow
}

if ($secrets -match "SUMUP_CLIENT_SECRET") {
    Write-Host "✅ SUMUP_CLIENT_SECRET is set" -ForegroundColor Green
} else {
    Write-Host "⚠️  SUMUP_CLIENT_SECRET is NOT set" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 2: Checking wrangler.toml configuration..." -ForegroundColor Yellow
Write-Host ""

$wranglerPath = "wrangler.toml"
if (Test-Path $wranglerPath) {
    $wranglerContent = Get-Content $wranglerPath -Raw
    
    if ($wranglerContent -match 'MAILERSEND_FROM_EMAIL\s*=\s*"([^"]+)"') {
        Write-Host "✅ MAILERSEND_FROM_EMAIL = $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "❌ MAILERSEND_FROM_EMAIL not found in wrangler.toml" -ForegroundColor Red
    }
    
    if ($wranglerContent -match 'MAILERSEND_FROM_NAME\s*=\s*"([^"]+)"') {
        Write-Host "✅ MAILERSEND_FROM_NAME = $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "❌ MAILERSEND_FROM_NAME not found in wrangler.toml" -ForegroundColor Red
    }
} else {
    Write-Host "❌ wrangler.toml not found in current directory" -ForegroundColor Red
    Write-Host "   Please run this script from the worker/ directory" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 3: Checking recent transactions in D1..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Running: wrangler d1 execute dicebastion-d1 --command 'SELECT ...')" -ForegroundColor Gray
$txQuery = "SELECT order_ref, payment_status, created_at FROM transactions ORDER BY created_at DESC LIMIT 5"
wrangler d1 execute dicebastion-d1 --command "$txQuery"

Write-Host ""
Write-Host "📋 Step 4: Checking email history..." -ForegroundColor Yellow
Write-Host ""

$emailQuery = "SELECT email_type, recipient_email, status, error_message FROM email_history ORDER BY sent_at DESC LIMIT 5"
wrangler d1 execute dicebastion-d1 --command "$emailQuery"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📝 Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($secrets -match "MAILERSEND_API_KEY") {
    Write-Host "✅ Email configuration looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If emails still aren't sending:" -ForegroundColor Yellow
    Write-Host "1. Check MailerSend dashboard: https://app.mailersend.com/" -ForegroundColor Gray
    Write-Host "2. Verify domain is verified and has correct DNS records" -ForegroundColor Gray
    Write-Host "3. Check spam folder" -ForegroundColor Gray
    Write-Host "4. Run: wrangler tail  (then make a test payment)" -ForegroundColor Gray
} else {
    Write-Host "❌ Action Required: Set up MailerSend API key" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this command:" -ForegroundColor Yellow
    Write-Host "   wrangler secret put MAILERSEND_API_KEY" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then deploy:" -ForegroundColor Yellow
    Write-Host "   wrangler deploy" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "For more help, see: worker/TROUBLESHOOTING_PAYMENTS.md" -ForegroundColor Gray
Write-Host ""
