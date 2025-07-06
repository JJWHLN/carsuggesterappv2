/**
 * Detox E2E Test Setup
 * This file runs before all E2E tests to set up the testing environment
 */

import { beforeAll, beforeEach, afterAll } from '@jest/globals';
import { by, device, element, expect, waitFor } from 'detox';

// Global test setup
beforeAll(async () => {
  // Wait for the app to fully load
  await device.launchApp({
    newInstance: true,
    permissions: { camera: 'YES', photos: 'YES' },
  });
  
  // Wait for the splash screen to finish and app to load
  try {
    await waitFor(element(by.text('Marketplace')))
      .toBeVisible()
      .withTimeout(10000);
  } catch (error) {
    console.log('App may not have loaded properly, continuing with test setup');
  }
});

beforeEach(async () => {
  // Clear app state between tests
  await device.reloadReactNative();
});

afterAll(async () => {
  // Clean up after all tests
  await device.terminateApp();
});

// Helper functions for common test actions
export const testHelpers = {
  // Sign in with test credentials
  async signIn(email: string = 'test@example.com', password: string = 'TestPassword123!') {
    await element(by.text('Sign In')).tap();
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('sign-in-button')).tap();
    
    // Wait for successful sign in
    await waitFor(element(by.text('Marketplace')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Sign out
  async signOut() {
    await element(by.text('Profile')).tap();
    await element(by.text('Sign Out')).tap();
    
    // Wait for auth screen
    await waitFor(element(by.text('Sign In')))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Navigate to a specific tab
  async navigateToTab(tabName: string) {
    await element(by.text(tabName)).tap();
    await waitFor(element(by.text(tabName)))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Search for cars
  async searchCars(query: string) {
    await element(by.id('search-input')).typeText(query);
    await element(by.id('search-button')).tap();
    
    // Wait for search results
    await waitFor(element(by.id('search-results')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Clear app data and restart
  async resetApp() {
    await device.launchApp({
      newInstance: true,
      delete: true,
    });
  }
};
