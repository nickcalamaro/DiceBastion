$apiBase = "https://dicebastion-memberships.ncalamaro.workers.dev"
$adminKey = "0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju"
$headers = @{"X-Admin-Key" = $adminKey; "Content-Type" = "application/json"}

Write-Host "Adding test products..." -ForegroundColor Cyan

$product1 = @{name="Warhammer 40K Starter Set";slug="wh40k-starter-set";description="Complete starter set";price=8500;stock_quantity=5;category="Miniatures"} | ConvertTo-Json
Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product1
Write-Host "Added Product 1" -ForegroundColor Green

$product2 = @{name="Premium Metal Dice Set";slug="metal-dice-set";description="High-quality metal dice set";price=3500;stock_quantity=20;category="Accessories"} | ConvertTo-Json
Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product2
Write-Host "Added Product 2" -ForegroundColor Green

$product3 = @{name="Catan Board Game";slug="catan-board-game";description="Classic strategy game";price=4200;stock_quantity=8;category="Board Games"} | ConvertTo-Json
Invoke-RestMethod -Uri "$apiBase/admin/products" -Method Post -Headers $headers -Body $product3
Write-Host "Added Product 3" -ForegroundColor Green

Write-Host "Done! View at http://localhost:1314/" -ForegroundColor Cyan
