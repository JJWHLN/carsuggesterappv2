/**
 * 🧪 Shared Test Utilities & Mocks
 * Consolidated testing utilities for the Car Suggester app
 */

import { Car } from '@/src/types/models';

// ===== TEST UTILITIES =====

/**
 * Wait for async operations to complete
 */
export const waitForAsync = (delay = 0) => 
  new Promise(resolve => setTimeout(resolve, delay));

/**
 * Mock timers helper
 */
export const mockTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
};

// ===== MOCK DATA FACTORIES =====

/**
 * Create mock Car data
 */
export const createMockCar = (overrides: Partial<Car> = {}): Car => ({
  id: 'mock-car-1',
  make: 'Toyota',
  model: 'RAV4',
  year: 2023,
  price: 32000,
  mileage: 15000,
  bodyStyle: 'SUV',
  condition: 'used',
  fuelType: 'gasoline',
  transmission: 'automatic',
  drivetrain: 'awd',
  fuelEfficiency: 28,
  safetyRating: 5,
  images: ['https://example.com/car1.jpg'],
  primaryImageUrl: 'https://example.com/car1.jpg',
  location: 'Seattle, WA',
  features: ['GPS Navigation', 'Bluetooth', 'Backup Camera'],
  description: 'Great condition SUV',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock User data
 */
export const createMockUser = (overrides: any = {}) => ({
  id: 'mock-user-1',
  email: 'test@example.com',
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock Review data
 */
export const createMockReview = (overrides: any = {}) => ({
  id: 'mock-review-1',
  carId: 'mock-car-1',
  userId: 'mock-user-1',
  rating: 4,
  title: 'Great car!',
  content: 'Really enjoying this vehicle. Highly recommend.',
  pros: ['Reliable', 'Good fuel economy'],
  cons: ['Road noise'],
  verified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock car array
 */
export const createMockCarList = (count = 3): Car[] =>
  Array.from({ length: count }, (_, index) =>
    createMockCar({
      id: `mock-car-${index + 1}`,
      make: ['Toyota', 'Honda', 'Ford'][index % 3],
      model: ['RAV4', 'CR-V', 'Explorer'][index],
      price: 30000 + (index * 5000),
    })
  );

// ===== MOCK SERVICES =====

/**
 * Mock Supabase service
 */
export const mockSupabaseService = {
  fetchVehicleListings: jest.fn(),
  fetchVehicleListingById: jest.fn(),
  fetchFeaturedCars: jest.fn(),
  fetchRecommendedCars: jest.fn(),
  fetchCarReviews: jest.fn(),
  searchVehiclesWithFilters: jest.fn(),
  fetchSavedCars: jest.fn(),
  addSavedCar: jest.fn(),
  removeSavedCar: jest.fn(),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
};

/**
 * Mock API service
 */
export const mockApiService = {
  getCars: jest.fn(),
  getCarById: jest.fn(),
  searchCars: jest.fn(),
  getRecommendations: jest.fn(),
  getBrands: jest.fn(),
  getModels: jest.fn(),
};

/**
 * Mock car store
 */
export const mockCarStore = {
  cars: [],
  featuredCars: [],
  recommendedCars: [],
  isLoading: false,
  error: null,
  setCars: jest.fn(),
  addCar: jest.fn(),
  updateCar: jest.fn(),
  removeCar: jest.fn(),
  getCarById: jest.fn(),
  loadFeaturedCars: jest.fn(),
  loadRecommendedCars: jest.fn(),
  searchCars: jest.fn(),
  filterCars: jest.fn(),
};

// ===== MOCK HOOKS =====

/**
 * Mock theme hook
 */
export const mockUseTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C7C7CC',
  },
  theme: 'light' as const,
  isDark: false,
  setTheme: jest.fn(),
};

/**
 * Mock navigation
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
};

/**
 * Mock router
 */
export const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
};

// ===== TEST ASSERTIONS =====

/**
 * Assert loading state
 */
export const expectLoadingState = (container: any) => {
  expect(container.getByTestId('loading-spinner')).toBeTruthy();
};

/**
 * Assert error state
 */
export const expectErrorState = (container: any, message?: string) => {
  expect(container.getByTestId('error-state')).toBeTruthy();
  if (message) {
    expect(container.getByText(message)).toBeTruthy();
  }
};

/**
 * Assert empty state
 */
export const expectEmptyState = (container: any) => {
  expect(container.getByTestId('empty-state')).toBeTruthy();
};

/**
 * Assert car card rendered
 */
export const expectCarCard = (container: any, car: Car) => {
  expect(container.getByText(car.make)).toBeTruthy();
  expect(container.getByText(car.model)).toBeTruthy();
  expect(container.getByText(`$${car.price.toLocaleString()}`)).toBeTruthy();
};

// ===== SETUP HELPERS =====

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset service mocks
  Object.values(mockSupabaseService).forEach(mock => mock.mockReset());
  Object.values(mockApiService).forEach(mock => mock.mockReset());
  Object.values(mockCarStore).forEach(mock => {
    if (typeof mock === 'function') mock.mockReset();
  });
};

// ===== ASYNC TESTING HELPERS =====

/**
 * Wait for component to finish loading
 */
export const waitForLoading = async (container: any) => {
  await waitForAsync(100);
  // Wait for loading to disappear if present
  try {
    const loadingElement = container.queryByTestId('loading-spinner');
    if (loadingElement) {
      await waitForAsync(500);
    }
  } catch {
    // Loading element not found, continue
  }
};

/**
 * Simulate async data fetch
 */
export function simulateAsyncSuccess<T>(data: T, delay = 100): Promise<T> {
  return new Promise<T>(resolve => setTimeout(() => resolve(data), delay));
}

export function simulateAsyncError(error: string, delay = 100): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(error)), delay));
}

// ===== ACCESSIBILITY TESTING =====

/**
 * Check accessibility properties
 */
export const expectAccessible = (element: any, label?: string) => {
  expect(element).toBeTruthy();
  if (label) {
    expect(element.props.accessibilityLabel).toBe(label);
  }
  expect(element.props.accessible).toBe(true);
};
