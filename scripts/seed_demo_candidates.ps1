param(
    [string]$ApiBase = "https://hrai-qf6p.onrender.com/api"
)

$ErrorActionPreference = "Stop"
$profilesPath = Join-Path $PSScriptRoot "..\supabase\demo_candidate_profiles.json"
$profiles = Get-Content -LiteralPath $profilesPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-Candidates {
    $response = Invoke-WebRequest -Uri "$ApiBase/candidates/" -UseBasicParsing
    return @($response.Content | ConvertFrom-Json)
}

$existing = Get-Candidates
$existingEmails = @{}

foreach ($candidate in $existing) {
    $existingEmails[$candidate.email.ToLowerInvariant()] = $true
}

$results = foreach ($profile in $profiles) {
    $email = $profile.email.ToLowerInvariant()
    if ($existingEmails.ContainsKey($email)) {
        [pscustomobject]@{
            Name = $profile.full_name
            Profession = $profile.profession
            Status = "present"
        }
        continue
    }

    try {
        $body = $profile | ConvertTo-Json -Depth 10 -Compress
        $encodedBody = [System.Text.Encoding]::UTF8.GetBytes($body)
        Invoke-RestMethod `
            -Uri "$ApiBase/candidates/save" `
            -Method Post `
            -ContentType "application/json; charset=utf-8" `
            -Body $encodedBody | Out-Null
        $existingEmails[$email] = $true
        [pscustomobject]@{
            Name = $profile.full_name
            Profession = $profile.profession
            Status = "created"
        }
    }
    catch {
        [pscustomobject]@{
            Name = $profile.full_name
            Profession = $profile.profession
            Status = "failed: $($_.Exception.Message)"
        }
    }
}

$results | Format-Table -AutoSize

$allCandidates = Get-Candidates
$demoCandidates = @(
    $allCandidates | Where-Object {
        $_.email -like "*.demo@ikai.example" -or
        $_.email -like "*ai.demo@ikai.example"
    }
)

Write-Output "TOTAL_CANDIDATES=$($allCandidates.Count)"
Write-Output "DEMO_CANDIDATES=$($demoCandidates.Count)"
$demoCandidates |
    Group-Object profession |
    Sort-Object Name |
    Select-Object Name, Count |
    Format-Table -AutoSize
