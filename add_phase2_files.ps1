# PowerShell script to add Phase 2 files to git

Write-Host "Adding Phase 2 files to git..." -ForegroundColor Green

# Add the main Phase 2 services
git add "services/socialService.ts"
git add "services/realTimeChatService.ts"

# Add the Phase 2 components
git add "components/SocialFeed.tsx"
git add "components/CarMarketplaceChat.tsx"
git add "components/EnhancedProfileScreen.tsx"
git add "components/EnhancedMarketplaceScreen.tsx"

# Add the integration guide
git add "PHASE_2_INTEGRATION.md"

Write-Host "Checking git status..." -ForegroundColor Yellow
git status

Write-Host "Files added! Ready to commit." -ForegroundColor Green
Write-Host "To commit, run: git commit -m 'Add Phase 2: Social features and real-time chat for car marketplace'" -ForegroundColor Cyan
