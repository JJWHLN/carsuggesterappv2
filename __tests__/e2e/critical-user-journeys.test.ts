import { by, device, element, expect, waitFor } from 'detox';

describe.skip('Critical User Journeys E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('User Authentication Flow', () => {
    it('should complete sign up, sign in, and sign out flow', async () => {
      // Navigate to sign up
      await element(by.text('Sign Up')).tap();
      
      // Fill sign up form
      await element(by.id('email-input')).typeText('testuser@example.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('confirm-password-input')).typeText('TestPassword123!');
      await element(by.id('sign-up-button')).tap();

      // Verify successful sign up (should redirect to main app)
      await waitFor(element(by.text('Marketplace')))
        .toBeVisible()
        .withTimeout(5000);

      // Sign out
      await element(by.text('Profile')).tap();
      await element(by.text('Sign Out')).tap();

      // Verify back to auth screen
      await waitFor(element(by.text('Sign In')))
        .toBeVisible()
        .withTimeout(3000);

      // Sign in with same credentials
      await element(by.id('email-input')).typeText('testuser@example.com');
      await element(by.id('password-input')).typeText('TestPassword123!');
      await element(by.id('sign-in-button')).tap();

      // Verify successful sign in
      await waitFor(element(by.text('Marketplace')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle password reset flow', async () => {
      await element(by.text('Forgot Password?')).tap();
      
      await element(by.id('email-input')).typeText('testuser@example.com');
      await element(by.id('reset-password-button')).tap();

      // Verify success message
      await waitFor(element(by.text('Password reset email sent')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate back
      await element(by.text('Back to Sign In')).tap();
      
      await waitFor(element(by.text('Sign In')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Vehicle Search and Browse Journey', () => {
    beforeEach(async () => {
      // Ensure user is logged in
      await element(by.text('Skip For Now')).tap();
    });

    it('should complete vehicle search to detail view journey', async () => {
      // Navigate to search
      await element(by.text('Search')).tap();
      
      // Perform search
      await element(by.id('search-input')).typeText('Toyota Camry');
      await element(by.id('search-button')).tap();

      // Wait for results
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap on first result
      await element(by.id('vehicle-card-0')).tap();

      // Verify detail screen
      await waitFor(element(by.text('Vehicle Details')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify key information is displayed
      await expect(element(by.id('vehicle-title'))).toBeVisible();
      await expect(element(by.id('vehicle-price'))).toBeVisible();
      await expect(element(by.id('vehicle-mileage'))).toBeVisible();
      await expect(element(by.id('contact-dealer-button'))).toBeVisible();
    });

    it('should browse marketplace and filter results', async () => {
      // Navigate to marketplace
      await element(by.text('Marketplace')).tap();

      // Wait for listings to load
      await waitFor(element(by.id('vehicle-listings')))
        .toBeVisible()
        .withTimeout(5000);

      // Open filters
      await element(by.id('filter-button')).tap();

      // Apply price filter - use swipe instead of setSliderValue
      await element(by.id('max-price-slider')).swipe('left', 'slow', 0.5);
      
      // Apply make filter
      await element(by.text('Toyota')).tap();
      
      // Apply filters
      await element(by.text('Apply Filters')).tap();

      // Verify filtered results
      await waitFor(element(by.id('filtered-results')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Toyota vehicles are shown
      await expect(element(by.text('Toyota')).atIndex(0)).toBeVisible();
    });

    it('should save and manage bookmarks', async () => {
      // Navigate to marketplace
      await element(by.text('Marketplace')).tap();

      // Wait for listings
      await waitFor(element(by.id('vehicle-listings')))
        .toBeVisible()
        .withTimeout(5000);

      // Bookmark first vehicle
      await element(by.id('bookmark-button-0')).tap();

      // Verify bookmark confirmation
      await waitFor(element(by.text('Added to bookmarks')))
        .toBeVisible()
        .withTimeout(2000);

      // Navigate to bookmarks
      await element(by.text('Bookmarks')).tap();

      // Verify bookmarked vehicle appears
      await waitFor(element(by.id('bookmarked-vehicles')))
        .toBeVisible()
        .withTimeout(3000);

      // Remove bookmark
      await element(by.id('remove-bookmark-0')).tap();

      // Verify removal confirmation
      await waitFor(element(by.text('Removed from bookmarks')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Car Listing Creation Journey', () => {
    beforeEach(async () => {
      // Login as dealer/seller
      await element(by.text('Sign In')).tap();
      await element(by.id('email-input')).typeText('dealer@example.com');
      await element(by.id('password-input')).typeText('DealerPassword123!');
      await element(by.id('sign-in-button')).tap();
      
      await waitFor(element(by.text('Marketplace')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should complete add car listing flow with image upload', async () => {
      // Navigate to add car
      await element(by.id('add-car-fab')).tap();

      // Fill basic information
      await element(by.id('car-make-input')).typeText('Honda');
      await element(by.id('car-model-input')).typeText('Civic');
      await element(by.id('car-year-input')).typeText('2020');
      await element(by.id('car-price-input')).typeText('23000');
      await element(by.id('car-mileage-input')).typeText('35000');

      // Select condition
      await element(by.id('condition-excellent')).tap();

      // Add description
      await element(by.id('description-input')).typeText('Well-maintained Honda Civic in excellent condition.');

      // Upload images (mock camera)
      await element(by.id('add-photos-button')).tap();
      await element(by.text('Camera')).tap();
      
      // Wait for image processing
      await waitFor(element(by.id('uploaded-image-0')))
        .toBeVisible()
        .withTimeout(5000);

      // Add location
      await element(by.id('location-input')).typeText('Los Angeles, CA');

      // Submit listing
      await element(by.id('submit-listing-button')).tap();

      // Verify success
      await waitFor(element(by.text('Listing created successfully')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify redirect to marketplace
      await waitFor(element(by.text('Marketplace')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate required fields and show errors', async () => {
      // Navigate to add car
      await element(by.id('add-car-fab')).tap();

      // Try to submit without required fields
      await element(by.id('submit-listing-button')).tap();

      // Verify validation errors
      await expect(element(by.text('Make is required'))).toBeVisible();
      await expect(element(by.text('Model is required'))).toBeVisible();
      await expect(element(by.text('Year is required'))).toBeVisible();
      await expect(element(by.text('Price is required'))).toBeVisible();
    });
  });

  describe('Review and Rating Journey', () => {
    beforeEach(async () => {
      // Ensure logged in
      await element(by.text('Skip For Now')).tap();
    });

    it('should browse and read vehicle reviews', async () => {
      // Navigate to reviews
      await element(by.text('Reviews')).tap();

      // Wait for reviews to load
      await waitFor(element(by.id('reviews-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap on first review
      await element(by.id('review-card-0')).tap();

      // Verify review detail screen
      await waitFor(element(by.text('Review Details')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify review content
      await expect(element(by.id('review-title'))).toBeVisible();
      await expect(element(by.id('review-rating'))).toBeVisible();
      await expect(element(by.id('review-content'))).toBeVisible();
      await expect(element(by.id('review-author'))).toBeVisible();
    });

    it('should filter reviews by category', async () => {
      // Navigate to reviews
      await element(by.text('Reviews')).tap();

      // Wait for reviews to load
      await waitFor(element(by.id('reviews-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Filter by Electric category
      await element(by.text('Electric')).tap();

      // Verify filtered results
      await waitFor(element(by.text('Electric vehicles')))
        .toBeVisible()
        .withTimeout(3000);

      // Switch to SUV category
      await element(by.text('SUV')).tap();

      // Verify SUV reviews are shown
      await waitFor(element(by.text('SUV reviews')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Performance and Offline Scenarios', () => {
    it('should handle network connectivity issues gracefully', async () => {
      // Simulate network disconnection
      await device.setURLBlacklist(['.*']);

      // Navigate to marketplace
      await element(by.text('Marketplace')).tap();

      // Verify offline message
      await waitFor(element(by.text('No internet connection')))
        .toBeVisible()
        .withTimeout(5000);

      // Restore network
      await device.setURLBlacklist([]);

      // Pull to refresh
      await element(by.id('marketplace-scroll')).scroll(200, 'up');

      // Verify content loads
      await waitFor(element(by.id('vehicle-listings')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should load cached content when available', async () => {
      // First load with network
      await element(by.text('Marketplace')).tap();
      
      await waitFor(element(by.id('vehicle-listings')))
        .toBeVisible()
        .withTimeout(5000);

      // Go back and simulate offline
      await element(by.text('Home')).tap();
      await device.setURLBlacklist(['.*']);

      // Navigate back to marketplace
      await element(by.text('Marketplace')).tap();

      // Should show cached content
      await waitFor(element(by.id('cached-content-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Restore network
      await device.setURLBlacklist([]);
    });
  });

  describe('Accessibility Journey', () => {
    it('should be navigable with screen reader', async () => {
      // Note: Accessibility testing would require specific setup in real implementation
      // For now, test accessibility labels and hints
      
      // Navigate using accessibility labels
      await element(by.label('Navigate to Search')).tap();
      await element(by.label('Search input field')).typeText('Honda');
      await element(by.label('Perform search')).tap();

      // Verify accessible results
      await waitFor(element(by.label('Search results list')))
        .toBeVisible()
        .withTimeout(5000);

      // Navigate to detail
      await element(by.label('View Honda Civic details')).tap();

      // Verify accessible detail view
      await expect(element(by.label('Vehicle information'))).toBeVisible();
      await expect(element(by.label('Contact dealer button'))).toBeVisible();
    });

    it('should support voice control navigation', async () => {
      // Simulate voice commands (would require additional setup in real app)
      await element(by.id('voice-command-button')).tap();
      
      // Verify voice recognition is active
      await waitFor(element(by.text('Listening...')))
        .toBeVisible()
        .withTimeout(2000);

      // Simulate voice command result
      await element(by.text('Search for Toyota')).tap();

      // Verify search was performed
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
