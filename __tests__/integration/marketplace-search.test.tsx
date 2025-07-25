import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MarketplaceScreen from '@/app/(tabs)/marketplace';
import SearchScreen from '@/app/search';
import {
  mockVehicles,
  renderWithProviders,
  waitForDataLoad,
  expectVehicleDisplay,
  expectErrorState,
  expectEmptyState,
  expectAnalyticsTracking,
  measurePerformance,
  createMockSupabaseQuery
} from '../utils/testUtils';

// Mock services with shared utilities
let mockQueryResult: { data: any; error: any } = { data: mockVehicles, error: null };
const mockSupabase = createMockSupabaseQuery();

// Update mock query result dynamically
const setMockQueryResult = (data: any, error: any = null) => {
  mockQueryResult = { data, error };
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

// Mock analytics
const mockAnalytics = {
  trackEvent: jest.fn(),
  trackScreen: jest.fn(),
  trackPerformance: jest.fn(),
};

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => mockAnalytics
}));

// Mock real-time service
const mockRealtimeService = {
  subscribeToVehicleListings: jest.fn(() => ({
    unsubscribe: jest.fn()
  })),
  subscribeToReviews: jest.fn(() => ({
    unsubscribe: jest.fn()
  }))
};

jest.mock('@/services/realtimeService', () => ({
  RealtimeService: mockRealtimeService
}));

// Mock OpenAI service
const mockOpenAIService = {
  searchVehicles: jest.fn(() => Promise.resolve({
    results: mockVehicles,
    query: 'test query'
  }))
};

jest.mock('@/lib/openai', () => ({
  OpenAIService: mockOpenAIService
}));

describe('Marketplace and Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMockQueryResult(mockVehicles, null);
  });

  describe('Marketplace Screen', () => {
    it('should load and display vehicle listings', async () => {
      const { getByText, queryByText } = renderWithProviders(<MarketplaceScreen />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeFalsy();
      });

      // Check vehicles using helper function
      expectVehicleDisplay(getByText, mockVehicles[0]);
      expectVehicleDisplay(getByText, mockVehicles[1]);
    });

    it('should handle real-time updates', async () => {
      renderWithProviders(<MarketplaceScreen />);

      expect(mockRealtimeService.subscribeToVehicleListings).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should handle empty state gracefully', async () => {
      setMockQueryResult([], null);
      const { getByText } = renderWithProviders(<MarketplaceScreen />);

      await expectEmptyState(getByText, /No vehicles found/i);
    });

    it('should handle API errors gracefully', async () => {
      setMockQueryResult(null, { message: 'Database error' });
      const { getByText } = renderWithProviders(<MarketplaceScreen />);

      await expectErrorState(getByText, /Error loading vehicles/i);
    });

    it('should navigate to vehicle details when tapped', async () => {
      const { getByText } = renderWithProviders(<MarketplaceScreen />);

      await waitForDataLoad(getByText, '2020 Toyota Camry');
      fireEvent.press(getByText('2020 Toyota Camry'));

      expect(mockRouter.push).toHaveBeenCalledWith('/car/1');
    });

    it('should implement pull-to-refresh functionality', async () => {
      const { getByTestId } = renderWithProviders(<MarketplaceScreen />);

      await waitFor(() => {
        const scrollView = getByTestId('marketplace-scroll');
        expect(scrollView).toBeTruthy();
      });

      const scrollView = getByTestId('marketplace-scroll');
      fireEvent(scrollView, 'refresh');

      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Screen', () => {
    beforeEach(() => {
      mockOpenAIService.searchVehicles.mockResolvedValue({
        results: mockVehicles,
        query: 'reliable sedan under $30000'
      });
    });

    it('should perform basic text search', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'Toyota');

      await waitForDataLoad(getByText, '2020 Toyota Camry', 1000);
    });

    it('should handle AI-powered search', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'reliable family car under $30000');
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        expect(mockOpenAIService.searchVehicles).toHaveBeenCalledWith(
          'reliable family car under $30000'
        );
      });

      expectVehicleDisplay(getByText, mockVehicles[0]);
      expectVehicleDisplay(getByText, mockVehicles[1]);
    });

    it('should handle search errors gracefully', async () => {
      mockOpenAIService.searchVehicles.mockRejectedValue(
        new Error('Search service unavailable')
      );

      const { getByPlaceholderText, getByText } = renderWithProviders(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'any car');
      fireEvent.press(getByText(/search/i));

      await expectErrorState(getByText, /search is temporarily unavailable/i);
    });

    it('should apply filters correctly', async () => {
      const { getByText, getByTestId } = renderWithProviders(<SearchScreen />);

      fireEvent.press(getByText(/filters/i));

      const maxPriceSlider = getByTestId('max-price-slider');
      fireEvent(maxPriceSlider, 'valueChange', 25000);

      fireEvent.press(getByText('Toyota'));
      fireEvent.press(getByText('Apply Filters'));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('vehicles');
      });
    });

    it('should handle empty search results', async () => {
      setMockQueryResult([], null);

      const { getByPlaceholderText, getByText } = renderWithProviders(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'nonexistent car');

      await expectEmptyState(getByText, /no vehicles found/i);
    });
  });

  describe('Performance and Analytics', () => {
    it('should track search events', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'Toyota');
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        expectAnalyticsTracking(mockAnalytics.trackEvent, 'search_performed', {
          query: 'Toyota',
          results_count: expect.any(Number)
        });
      });
    });

    it('should track vehicle listing views', async () => {
      const { getByText } = renderWithProviders(<MarketplaceScreen />);

      await waitForDataLoad(getByText, '2020 Toyota Camry');
      fireEvent.press(getByText('2020 Toyota Camry'));

      expectAnalyticsTracking(mockAnalytics.trackEvent, 'vehicle_listing_viewed', {
        vehicle_id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020
      });
    });

    it('should maintain good performance under load', async () => {
      const duration = await measurePerformance(async () => {
        const promises = [
          renderWithProviders(<MarketplaceScreen />),
          renderWithProviders(<SearchScreen />)
        ];
        await Promise.all(promises);
      });

      // Should render both screens within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});
