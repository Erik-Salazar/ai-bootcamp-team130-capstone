# End-to-end API smoke test for MaintNotary (local demo; chain/worker optional).
$ErrorActionPreference = "Stop"
$api = "http://localhost:4000"
$key = "dev-local-api-key"
$headers = @{
    Authorization  = "Bearer $key"
    "Content-Type" = "application/json"
}
$rid = "wo-e2e-" + (Get-Date -Format "yyyyMMddHHmmss")
$script:passCount = 0
$script:failCount = 0

function Assert-Step {
    param(
        [string] $Name,
        [bool] $Condition,
        [string] $Detail = ""
    )
    if ($Condition) {
        Write-Host ("  PASS  " + $Name) -ForegroundColor Green
        $script:passCount++
    }
    else {
        Write-Host ("  FAIL  " + $Name + " " + $Detail) -ForegroundColor Red
        $script:failCount++
    }
}

Write-Host ""
Write-Host "=== MaintNotary E2E (API $api) ===" -ForegroundColor Cyan
Write-Host ""

# 0. Health
$health = Invoke-RestMethod "$api/health"
Assert-Step -Name "GET /health" -Condition ($health.status -eq "ok")

# 1. Validation reject
$invalidOk = $false
try {
    $bad = @{ schema_version = "1.0"; record_id = $rid; vin = "SHORT" } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$api/api/records" -Headers $headers -Body $bad | Out-Null
}
catch {
    $invalidOk = ([int]$_.Exception.Response.StatusCode -eq 400)
}
Assert-Step -Name "POST invalid VIN returns 400" -Condition $invalidOk

# 2. Submit valid
$submitObj = @{
    schema_version  = "1.0"
    record_id       = $rid
    vin             = "1FUJGHDV8CLBR1234"
    equipment_label = "Truck 104"
    service_type    = "PM-A"
    completed_at    = "2026-07-22T12:00:00Z"
    odometer_miles  = 145000
    shop_name       = "In-house shop"
    notes           = "e2e submit"
}
$submitBody = $submitObj | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri "$api/api/records" -Headers $headers -Body $submitBody
$submitOk = ($created.success -eq $true) -and ($created.status -eq "pending_anchor") -and ($created.record_id -eq $rid) -and [bool]$created.id
Assert-Step -Name "POST /api/records success" -Condition $submitOk
$id = $created.id
Write-Host ("       id=" + $id) -ForegroundColor DarkGray

# 3. Duplicate reject
$dupOk = $false
try {
    Invoke-RestMethod -Method Post -Uri "$api/api/records" -Headers $headers -Body $submitBody | Out-Null
}
catch {
    $dupOk = ([int]$_.Exception.Response.StatusCode -eq 400)
}
Assert-Step -Name "POST duplicate returns 400" -Condition $dupOk

# 4. List
$list = Invoke-RestMethod "$api/api/records?vin=1FUJGHDV8CLBR1234&limit=50"
$found = @($list.records | Where-Object { $_.record_id -eq $rid }).Count -gt 0
Assert-Step -Name "GET /api/records includes new row" -Condition ($found -and ($list.total -ge 1))

# 5. Detail
$detail = Invoke-RestMethod "$api/api/records/$id"
$detailOk = ($detail.record_id -eq $rid) -and [bool]$detail.content_hash -and ($detail.verify_url -like "*$id*")
Assert-Step -Name "GET /api/records/:id detail" -Condition $detailOk

# 6. Verify by id (pending, no contract => not_anchored)
$vId = Invoke-RestMethod "$api/api/verify/$id"
Assert-Step -Name "GET /api/verify/:id pending is not_anchored" -Condition ($vId.integrity -eq "not_anchored")

# 7. Verify Flow A
$flowA = @{
    schema_version = "1.0"
    record_id      = "wo-never-existed-e2e"
    vin            = "1FUJGHDV8CLBR1234"
    service_type   = "PM-A"
    completed_at   = "2026-07-22T12:00:00Z"
    odometer_miles = 145000
    shop_name      = "In-house shop"
} | ConvertTo-Json
$vA = Invoke-RestMethod -Method Post -Uri "$api/api/verify" -ContentType "application/json" -Body $flowA
Assert-Step -Name "POST /api/verify Flow A not_found with hash" -Condition (($vA.integrity -eq "not_found") -and [bool]$vA.content_hash)

# 8. Verify Flow B pending
$vB = Invoke-RestMethod -Method Post -Uri "$api/api/verify" -ContentType "application/json" -Body $submitBody
Assert-Step -Name "POST /api/verify Flow B pending is not_anchored" -Condition ($vB.integrity -eq "not_anchored")

# 9. Seeded anchored => verified (DB status; chain optional)
$anchoredList = Invoke-RestMethod "$api/api/records?status=anchored&limit=1"
if (@($anchoredList.records).Count -gt 0) {
    $aid = @($anchoredList.records)[0].id
    $vAnch = Invoke-RestMethod "$api/api/verify/$aid"
    Assert-Step -Name "GET /api/verify seeded anchored is verified" -Condition ($vAnch.integrity -eq "verified")
}
else {
    Assert-Step -Name "GET /api/verify seeded anchored is verified" -Condition $false -Detail "no anchored rows"
}

# 10. Import
$importId = "wo-e2e-import-" + (Get-Date -Format "HHmmss")
$importBody = @{
    event   = "work_order.completed"
    payload = @{
        work_order_id = $importId
        vehicle_vin   = "1HGCM82633A004352"
        vehicle_name  = "Van 12"
        service_type  = "Oil Change"
        completed_at  = "2026-07-22T15:00:00Z"
        odometer      = 90000
        vendor_name   = "Fleet Depot"
        description   = "e2e import"
    }
} | ConvertTo-Json -Depth 5
$imported = Invoke-RestMethod -Method Post -Uri "$api/api/import" -Headers $headers -Body $importBody
Assert-Step -Name "POST /api/import success" -Condition (($imported.success -eq $true) -and ($imported.record_id -eq $importId))

# 11. Retry seeded failed
$failed = Invoke-RestMethod "$api/api/records?status=anchor_failed&limit=1"
if (@($failed.records).Count -gt 0) {
    $fid = @($failed.records)[0].id
    $retried = Invoke-RestMethod -Method Post -Uri "$api/api/records/$fid/retry" -Headers $headers
    Assert-Step -Name "POST retry anchor_failed to pending_anchor" -Condition (($retried.success -eq $true) -and ($retried.status -eq "pending_anchor"))

    $retry409 = $false
    try {
        Invoke-RestMethod -Method Post -Uri "$api/api/records/$fid/retry" -Headers $headers | Out-Null
    }
    catch {
        $retry409 = ([int]$_.Exception.Response.StatusCode -eq 409)
    }
    Assert-Step -Name "POST retry again returns 409" -Condition $retry409
}
else {
    Assert-Step -Name "POST retry seeded failed" -Condition $false -Detail "no anchor_failed rows; re-seed"
}

# 12. Web UI
$webOk = $false
try {
    $web = Invoke-WebRequest "http://localhost:5173" -UseBasicParsing
    $webOk = ($web.StatusCode -eq 200)
}
catch {
    $webOk = $false
}
Assert-Step -Name "Web UI on 5173" -Condition $webOk

Write-Host ""
$color = if ($script:failCount -eq 0) { "Green" } else { "Yellow" }
Write-Host ("=== Result: {0} passed, {1} failed ===" -f $script:passCount, $script:failCount) -ForegroundColor $color
Write-Host "Note: Worker/on-chain not exercised. Pending verify => not_anchored is expected without CONTRACT_ADDRESS." -ForegroundColor DarkGray
Write-Host ""

if ($script:failCount -gt 0) { exit 1 }
exit 0
