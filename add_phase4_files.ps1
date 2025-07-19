# Phase 4 Git Addition Script
# Adds all Phase 4 Advanced ML & Performance Platform files to git

Write-Host "=== Phase 4: Advanced ML & Performance Platform - Git Addition ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the root of your git repository" -ForegroundColor Yellow
    exit 1
}

Write-Host "Adding Phase 4 files to git..." -ForegroundColor Green

# Phase 4 files to add
$phase4Files = @(
    "services/advancedMLService.ts",
    "services/enhancedSearchService.ts", 
    "services/performanceOptimizationService.ts",
    "components/EnhancedCarDetailsView.tsx",
    "PHASE_4_INTEGRATION.md",
    "add_phase4_files.ps1"
)

# Check which files exist
$existingFiles = @()
$missingFiles = @()

foreach ($file in $phase4Files) {
    if (Test-Path $file) {
        $existingFiles += $file
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""

if ($missingFiles.Count -gt 0) {
    Write-Host "Warning: Some Phase 4 files are missing:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $continue = Read-Host "Continue adding existing files? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Add existing files to git
if ($existingFiles.Count -gt 0) {
    Write-Host "Adding existing files to git..." -ForegroundColor Blue
    
    foreach ($file in $existingFiles) {
        try {
            git add $file
            Write-Host "✓ Added: $file" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to add: $file" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Files added to git staging area." -ForegroundColor Green
    Write-Host ""
    
    # Show git status
    Write-Host "Current git status:" -ForegroundColor Blue
    git status --porcelain | Where-Object { $_ -match "services/|components/|\.md$|\.ps1$" }
    
    Write-Host ""
    Write-Host "Phase 4 files summary:" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    Write-Host "✓ Advanced ML Service: Comprehensive machine learning engine" -ForegroundColor Green
    Write-Host "✓ Enhanced Search Service: Intelligent search with ML features" -ForegroundColor Green
    Write-Host "✓ Performance Optimization: Advanced performance monitoring" -ForegroundColor Green
    Write-Host "✓ Enhanced Car Details View: ML-powered viewing experience" -ForegroundColor Green
    Write-Host "✓ Integration Guide: Complete Phase 4 implementation guide" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Ready to commit? Run:" -ForegroundColor Yellow
    Write-Host 'git commit -m "Phase 4: Advanced ML & Performance Platform"' -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to commit now
    $commitNow = Read-Host "Commit these changes now? (y/n)"
    if ($commitNow -eq "y" -or $commitNow -eq "Y") {
        Write-Host ""
        Write-Host "Committing Phase 4 files..." -ForegroundColor Blue
        
        $commitMessage = "Phase 4: Advanced ML & Performance Platform

- Added comprehensive ML service with user behavior analysis
- Implemented intelligent search with NLP capabilities  
- Created performance optimization service with monitoring
- Built enhanced car details view with AI insights
- Added complete Phase 4 integration documentation

Features:
• Advanced machine learning algorithms
• Natural language processing for search
• Real-time performance monitoring
• Smart caching and optimization
• AI-powered car insights and recommendations
• Enhanced user experience with ML personalization"

        try {
            git commit -m $commitMessage
            Write-Host ""
            Write-Host "✓ Successfully committed Phase 4 files!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Phase 4 implementation complete!" -ForegroundColor Cyan
            Write-Host "Your car marketplace now features:" -ForegroundColor White
            Write-Host "• Advanced ML & AI capabilities" -ForegroundColor Green
            Write-Host "• Intelligent search and recommendations" -ForegroundColor Green  
            Write-Host "• Performance optimization and monitoring" -ForegroundColor Green
            Write-Host "• Enhanced viewing experiences" -ForegroundColor Green
            Write-Host "• Comprehensive user behavior analysis" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to commit files" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "Files staged but not committed." -ForegroundColor Yellow
        Write-Host "You can commit later with:" -ForegroundColor White
        Write-Host 'git commit -m "Phase 4: Advanced ML & Performance Platform"' -ForegroundColor Gray
    }
} else {
    Write-Host "No Phase 4 files found to add." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Phase 4 git addition complete!" -ForegroundColor Cyan
