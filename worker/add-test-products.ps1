# Add Test Products to Dice Bastion Shop
# Replace YOUR_ADMIN_KEY with: 0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju

$apiBase = "https://dicebastion-memberships.ncalamaro.workers.dev"
$adminKey = "0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju"

$headers = @{
    "X-Admin-Key" = $adminKey
    "Content-Type" = "application/json"
}

Write-Host "Adding test products to shop..." -ForegroundColor Cyan

# Product 1: Warhammer 40K Starter Set
$product1 = @{
    name = "Warhammer 40K Starter Set"
    slug = "wh40k-starter-set"
    description = "Complete starter set for Warhammer 40,000. Includes rulebook, dice, and miniatures for two armies."
    price = 8500
    currency = "GBP"
    stock_quantity = 5
    category = "Miniatures"
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product1
    Write-Host "✓ Added: Warhammer 40K Starter Set (ID: $($result1.product_id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Warhammer 40K Starter Set: $_" -ForegroundColor Red
}

# Product 2: Dice Set
$product2 = @{
    name = "Premium Metal Dice Set"
    slug = "metal-dice-set"
    description = "High-quality metal dice set with felt-lined case. Includes 7 polyhedral dice in gunmetal finish."
    price = 3500
    currency = "GBP"
    stock_quantity = 20
    category = "Accessories"
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product2
    Write-Host "✓ Added: Premium Metal Dice Set (ID: $($result2.product_id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Metal Dice Set: $_" -ForegroundColor Red
}

# Product 3: Board Game
$product3 = @{
    name = "Catan Board Game"
    slug = "catan-board-game"
    description = "The classic strategy game of trading and building. For 3-4 players, ages 10+."
    price = 4200
    currency = "GBP"
    stock_quantity = 8
    category = "Board Games"
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product3
    Write-Host "✓ Added: Catan Board Game (ID: $($result3.product_id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Catan Board Game: $_" -ForegroundColor Red
}

# Product 4: Paint Set
$product4 = @{
    name = "Citadel Paint Starter Set"
    slug = "citadel-paint-set"
    description = "Essential paint set for miniature painting. Includes 10 Citadel paints and 1 brush."
    price = 2800
    currency = "GBP"
    stock_quantity = 15
    category = "Painting Supplies"
} | ConvertTo-Json

try {
    $result4 = Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product4
    Write-Host "✓ Added: Citadel Paint Starter Set (ID: $($result4.product_id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Paint Starter Set: $_" -ForegroundColor Red
}

# Product 5: Low Stock Item
$product5 = @{
    name = "Limited Edition Dice Tower"
    slug = "limited-dice-tower"
    description = "Handcrafted wooden dice tower with intricate dragon design. Limited availability!"
    price = 6500
    currency = "GBP"
    stock_quantity = 2
    category = "Accessories"
} | ConvertTo-Json

try {
    $result5 = Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product5
    Write-Host "✓ Added: Limited Edition Dice Tower (ID: $($result5.product_id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Dice Tower: $_" -ForegroundColor Red
}

Write-Host "`n✓ Test products added successfully!" -ForegroundColor Green
Write-Host "View them at: http://localhost:1314/" -ForegroundColor Cyan

