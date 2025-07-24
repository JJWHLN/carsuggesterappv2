/**
 * Test Utilities - Shared mocks, data and helpers for integration tests
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '@/contexts/AuthContext';

// ===== SHARED MOCK DATA =====
export const mockVehicles = [
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
  },
  {
    id: '3',
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    price: 35000,
    mileage: 15000,
    images: ['https://example.com/car3.jpg'],
    condition: 'excellent',
    location_city: 'New York',
    location_state: 'NY',
    created_at: '2024-01-03T00:00:00.000Z'
  }
];

export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

export const mockUserPreferences = {
  budget: { min: 20000, max: 40000 },
  preferredMakes: ['Toyota', 'Honda'],
  preferredBodyTypes: ['sedan'],
  maxMileage: 50000
};

// ===== MOCK FACTORIES =====
export const createMockSupabaseQuery = (data: any = mockVehicles, error: any = null) => {
  const mockQueryResult = { data, error };
  
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

  return {
    from: jest.fn(() => ({
      select: jest.fn(() => createMockFilterChain()),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      })),
      unsubscribe: jest.fn()
    })),
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    }
  };
};

export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
});

export const createMockAnalytics = () => ({
  trackEvent: jest.fn(),
  trackScreen: jest.fn(),
  trackPerformance: jest.fn(),
});

export const createMockServices = () => ({
  realtimeService: {
    subscribeToVehicleListings: jest.fn(() => ({
      unsubscribe: jest.fn()
    })),
    subscribeToReviews: jest.fn(() => ({
      unsubscribe: jest.fn()
    }))
  },
  openAIService: {
    searchVehicles: jest.fn(() => Promise.resolve({
      results: mockVehicles,
      query: 'test query'
    }))
  },
  storageService: {
    uploadCarImages: jest.fn(() => Promise.resolve(['image1.jpg', 'image2.jpg']))
  },
  vehicleListingService: {
    createListing: jest.fn(() => Promise.resolve({ id: 'new-listing-123' }))
  }
});

// ===== RENDER HELPERS =====
export const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

// ===== COMMON TEST PATTERNS =====
export const waitForDataLoad = async (getByText: any, expectedText: string, timeout = 3000) => {
  const { waitFor } = require('@testing-library/react-native');
  await waitFor(() => {
    expect(getByText(expectedText)).toBeTruthy();
  }, { timeout });
};

export const expectVehicleDisplay = (getByText: any, vehicle: typeof mockVehicles[0]) => {
  expect(getByText(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)).toBeTruthy();
  expect(getByText(`$${vehicle.price.toLocaleString()}`)).toBeTruthy();
};

export const expectErrorState = async (getByText: any, errorPattern: RegExp) => {
  const { waitFor } = require('@testing-library/react-native');
  await waitFor(() => {
    expect(getByText(errorPattern)).toBeTruthy();
  });
};

export const expectEmptyState = async (getByText: any, emptyPattern: RegExp) => {
  const { waitFor } = require('@testing-library/react-native');
  await waitFor(() => {
    expect(getByText(emptyPattern)).toBeTruthy();
  });
};

// ===== MOCK IMPLEMENTATIONS =====
export const setupCommonMocks = () => {
  const mockRouter = createMockRouter();
  const mockAnalytics = createMockAnalytics();
  const mockServices = createMockServices();
  const mockSupabase = createMockSupabaseQuery();

  // Jest mocks
  jest.mock('expo-router', () => ({
    router: mockRouter,
    useRouter: () => mockRouter,
  }));

  jest.mock('@/hooks/useAnalytics', () => ({
    useAnalytics: () => mockAnalytics
  }));

  jest.mock('@/lib/supabase', () => ({
    supabase: mockSupabase
  }));

  jest.mock('@/services/realtimeService', () => ({
    RealtimeService: mockServices.realtimeService
  }));

  jest.mock('@/lib/openai', () => ({
    OpenAIService: mockServices.openAIService
  }));

  jest.mock('@/services/storageService', () => ({
    StorageService: mockServices.storageService
  }));

  jest.mock('@/services/featureServices', () => ({
    VehicleListingService: mockServices.vehicleListingService
  }));

  return {
    mockRouter,
    mockAnalytics,
    mockServices,
    mockSupabase
  };
};

// ===== CUSTOM ASSERTIONS =====
export const expectAccessibilityProps = (element: any, expectedProps: {
  role?: string;
  label?: string;
  hint?: string;
  state?: any;
}) => {
  if (expectedProps.role) {
    expect(element.props.accessibilityRole).toBe(expectedProps.role);
  }
  if (expectedProps.label) {
    expect(element.props.accessibilityLabel).toBe(expectedProps.label);
  }
  if (expectedProps.hint) {
    expect(element.props.accessibilityHint).toBe(expectedProps.hint);
  }
  if (expectedProps.state) {
    expect(element.props.accessibilityState).toEqual(expectedProps.state);
  }
};

export const expectAnalyticsTracking = (mockTrackEvent: jest.Mock, eventName: string, eventData?: any) => {
  expect(mockTrackEvent).toHaveBeenCalledWith(eventName, eventData ? expect.objectContaining(eventData) : expect.any(Object));
};

// ===== PERFORMANCE TESTING HELPERS =====
export const measurePerformance = async (operation: () => Promise<any>, maxTime: number = 3000) => {
  const startTime = Date.now();
  await operation();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(maxTime);
  return duration;
};

// ===== AUTH TEST HELPERS =====
export const expectSuccessfulAuth = (mockSupabase: any, user = mockUser) => {
  mockSupabase.auth.signInWithPassword.mockResolvedValue({
    data: { user, session: { access_token: 'token' } },
    error: null
  });
};

export const expectAuthError = (mockSupabase: any, errorMessage: string) => {
  mockSupabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message: errorMessage }
  });
};

// ===== FORM TESTING HELPERS =====
export const fillForm = (getByPlaceholderText: any, formData: Record<string, string>) => {
  const { fireEvent } = require('@testing-library/react-native');
  
  Object.entries(formData).forEach(([placeholder, value]) => {
    const input = getByPlaceholderText(new RegExp(placeholder, 'i'));
    fireEvent.changeText(input, value);
  });
};

export const submitForm = (getByText: any, buttonText: string = 'Submit') => {
  const { fireEvent } = require('@testing-library/react-native');
  const submitButton = getByText(new RegExp(buttonText, 'i'));
  fireEvent.press(submitButton);
};
