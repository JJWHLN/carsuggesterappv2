import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MarketplaceScreen from '@/app/(tabs)/marketplace';
import SearchScreen from '@/app/search';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock services
const mockVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    price: 25000,
    mileage: 30000,
    images: ['https://example.com/car1.jpg'],
    condition: 'excellent',
    location_city: 'Los Angeles',
    location_state: 'CA',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    price: 22000,
    mileage: 25000,
    images: ['https://example.com/car2.jpg'],
    condition: 'good',
    location_city: 'San Francisco',
    location_state: 'CA',
    created_at: '2024-01-02T00:00:00.000Z'
  }
];

// Create a dynamic mock function that can return different data based on context
let mockQueryResult: { data: any; error: any } = { data: mockVehicles, error: null };

const createMockChain = () => ({
  range: jest.fn(() => Promise.resolve(mockQueryResult)),
});

const createMockOrderChain = () => ({
  order: jest.fn(() => createMockChain()),
});

const createMockFilterChain = () => ({
  eq: jest.fn(() => createMockOrderChain()),
  ilike: jest.fn(() => createMockOrderChain()),
  order: jest.fn(() => createMockChain()),
});

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => createMockFilterChain()),
  })),
  channel: jest.fn(() => ({
    on: jest.fn(() => ({
      subscribe: jest.fn()
    })),
    unsubscribe: jest.fn()
  }))
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
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackScreen: jest.fn(),
    trackPerformance: jest.fn(),
  })
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
  searchVehicles: jest.fn()
};

jest.mock('@/lib/openai', () => ({
  OpenAIService: mockOpenAIService
}));

describe('Marketplace and Search Integration Tests', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock query result to default
    mockQueryResult = { data: mockVehicles, error: null };
  });

  describe('Marketplace Screen', () => {
    it('should load and display vehicle listings', async () => {
      const { getByText, queryByText } = renderWithAuth(<MarketplaceScreen />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeFalsy();
      });

      // Check if vehicles are displayed
      expect(getByText('2020 Toyota Camry')).toBeTruthy();
      expect(getByText('2019 Honda Civic')).toBeTruthy();
      expect(getByText('$25,000')).toBeTruthy();
      expect(getByText('$22,000')).toBeTruthy();
    });

    it('should handle real-time updates', async () => {
      const { getByText } = renderWithAuth(<MarketplaceScreen />);

      // Verify real-time subscription was set up
      expect(mockRealtimeService.subscribeToVehicleListings).toHaveBeenCalledWith(
        expect.any(Function)
      );

      await waitFor(() => {
        expect(getByText('2020 Toyota Camry')).toBeTruthy();
      });
    });

    it('should handle empty state gracefully', async () => {
      // Update mock result for this test
      mockQueryResult = { data: [], error: null };

      const { getByText } = renderWithAuth(<MarketplaceScreen />);

      await waitFor(() => {
        expect(getByText(/No vehicles found/i)).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Update mock result for this test
      mockQueryResult = { data: null, error: { message: 'Database error' } };

      const { getByText } = renderWithAuth(<MarketplaceScreen />);

      await waitFor(() => {
        expect(getByText(/Error loading vehicles/i)).toBeTruthy();
      });
    });

    it('should navigate to vehicle details when tapped', async () => {
      const { getByText } = renderWithAuth(<MarketplaceScreen />);

      await waitFor(() => {
        expect(getByText('2020 Toyota Camry')).toBeTruthy();
      });

      fireEvent.press(getByText('2020 Toyota Camry'));

      expect(mockRouter.push).toHaveBeenCalledWith('/car/1');
    });

    it('should implement pull-to-refresh functionality', async () => {
      const { getByTestId } = renderWithAuth(<MarketplaceScreen />);

      await waitFor(() => {
        const scrollView = getByTestId('marketplace-scroll');
        expect(scrollView).toBeTruthy();
      });

      // Simulate pull-to-refresh
      const scrollView = getByTestId('marketplace-scroll');
      fireEvent(scrollView, 'refresh');

      // Verify API was called again
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Screen', () => {
    beforeEach(() => {
      // Reset OpenAI mock
      mockOpenAIService.searchVehicles.mockResolvedValue({
        results: mockVehicles,
        query: 'reliable sedan under $30000'
      });
    });

    it('should perform basic text search', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'Toyota');

      // Wait for debounced search
      await waitFor(() => {
        expect(getByText('2020 Toyota Camry')).toBeTruthy();
      }, { timeout: 1000 });
    });

    it('should handle AI-powered search', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'reliable family car under $30000');

      // Trigger search button
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        expect(mockOpenAIService.searchVehicles).toHaveBeenCalledWith(
          'reliable family car under $30000'
        );
      });

      await waitFor(() => {
        expect(getByText('2020 Toyota Camry')).toBeTruthy();
        expect(getByText('2019 Honda Civic')).toBeTruthy();
      });
    });

    it('should handle search errors gracefully', async () => {
      mockOpenAIService.searchVehicles.mockRejectedValue(
        new Error('Search service unavailable')
      );

      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'any car');
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        expect(getByText(/search is temporarily unavailable/i)).toBeTruthy();
      });
    });

    it('should apply filters correctly', async () => {
      const { getByText, getByTestId } = renderWithAuth(<SearchScreen />);

      // Open filters
      fireEvent.press(getByText(/filters/i));

      // Apply price filter
      const maxPriceSlider = getByTestId('max-price-slider');
      fireEvent(maxPriceSlider, 'valueChange', 25000);

      // Apply make filter
      fireEvent.press(getByText('Toyota'));

      // Apply filters
      fireEvent.press(getByText('Apply Filters'));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('vehicles');
        // Verify filter conditions were applied
      });
    });

    it('should save and load search history', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      
      // Perform multiple searches
      fireEvent.changeText(searchInput, 'Toyota');
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        fireEvent.changeText(searchInput, 'Honda');
        fireEvent.press(getByText(/search/i));
      });

      // Check if recent searches are displayed
      fireEvent.press(searchInput); // Focus to show suggestions

      await waitFor(() => {
        expect(getByText('Toyota')).toBeTruthy();
        expect(getByText('Honda')).toBeTruthy();
      });
    });

    it('should display search suggestions', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'Toy');

      await waitFor(() => {
        expect(getByText('Toyota Camry')).toBeTruthy();
        expect(getByText('Toyota Corolla')).toBeTruthy();
      });
    });

    it('should handle empty search results', async () => {
      // Update mock result for this test
      mockQueryResult = { data: [], error: null };

      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'nonexistent car');

      await waitFor(() => {
        expect(getByText(/no vehicles found/i)).toBeTruthy();
      });
    });
  });

  describe('Performance and Analytics', () => {
    it('should track search events', async () => {
      const mockTrackEvent = jest.fn();
      
      jest.doMock('@/hooks/useAnalytics', () => ({
        useAnalytics: () => ({
          trackEvent: mockTrackEvent,
          trackScreen: jest.fn(),
          trackPerformance: jest.fn(),
        })
      }));

      const { getByPlaceholderText, getByText } = renderWithAuth(<SearchScreen />);

      const searchInput = getByPlaceholderText(/search for cars/i);
      fireEvent.changeText(searchInput, 'Toyota');
      fireEvent.press(getByText(/search/i));

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('search_performed', {
          query: 'Toyota',
          results_count: expect.any(Number)
        });
      });
    });

    it('should track vehicle listing views', async () => {
      const mockTrackEvent = jest.fn();
      
      jest.doMock('@/hooks/useAnalytics', () => ({
        useAnalytics: () => ({
          trackEvent: mockTrackEvent,
          trackScreen: jest.fn(),
          trackPerformance: jest.fn(),
        })
      }));

      const { getByText } = renderWithAuth(<MarketplaceScreen />);

      await waitFor(() => {
        expect(getByText('2020 Toyota Camry')).toBeTruthy();
      });

      fireEvent.press(getByText('2020 Toyota Camry'));

      expect(mockTrackEvent).toHaveBeenCalledWith('vehicle_listing_viewed', {
        vehicle_id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020
      });
    });
  });
});
