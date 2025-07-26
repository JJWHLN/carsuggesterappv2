import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BrandShowcase } from '../BrandShowcase';

// Mock the dependencies
jest.mock('@/hooks/useTheme', () => ({
  useThemeColors: () => ({
    colors: {
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007AFF',
      primaryLight: '#E6F3FF',
      white: '#FFFFFF',
      border: '#E0E0E0',
    },
  }),
}));

jest.mock('@/components/ui/OptimizedImage', () => {
  const { View } = require('react-native');
  return {
    OptimizedImage: ({ testID, ...props }: any) => (
      <View testID={testID} {...props} />
    ),
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => ({
  BrandSkeletonLoader: ({ featured }: { featured: boolean }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={featured ? 'featured-skeleton' : 'regular-skeleton'}>
        <Text>Loading...</Text>
      </View>
    );
  },
}));

jest.mock('@/constants/Colors', () => ({
  Spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  Typography: {
    sectionTitle: { fontSize: 20, fontWeight: '600' },
    bodyText: { fontSize: 16 },
    bodySmall: { fontSize: 14 },
    cardTitle: { fontSize: 18 },
    caption: { fontSize: 12 },
  },
  BorderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  Shadows: {
    small: { shadowOpacity: 0.1 },
    card: { shadowOpacity: 0.15 },
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    useSharedValue: (value: any) => ({ value }),
    useAnimatedStyle: (fn: any) => ({}),
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
    default: {
      View: View,
    },
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  ArrowRight: ({ testID, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={testID} {...props} />;
  },
  Building2: ({ testID, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={testID} {...props} />;
  },
  TrendingUp: ({ testID, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={testID} {...props} />;
  },
  Star: ({ testID, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={testID} {...props} />;
  },
}));

describe('BrandShowcase', () => {
  const mockBrands = [
    {
      id: '1',
      name: 'BMW',
      logo_url: 'https://example.com/bmw.png',
      model_count: 25,
      popular: true,
      rating: 4.5,
      new_arrivals: 3,
    },
    {
      id: '2',
      name: 'Mercedes-Benz',
      logo_url: 'https://example.com/mercedes.png',
      model_count: 30,
      popular: false,
      rating: 4.3,
      new_arrivals: 2,
    },
    {
      id: '3',
      name: 'Audi',
      logo_url: 'https://example.com/audi.png',
      model_count: 20,
      popular: true,
      rating: 4.4,
      new_arrivals: 1,
    },
    {
      id: '4',
      name: 'Toyota',
      logo_url: 'https://example.com/toyota.png',
      model_count: 35,
      popular: false,
    },
  ];

  const defaultProps = {
    brands: mockBrands,
    loading: false,
    onViewAll: jest.fn(),
    onBrandPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with brands', () => {
    const { getByText, getByTestId } = render(
      <BrandShowcase {...defaultProps} />,
    );

    expect(getByText('Popular Brands')).toBeTruthy();
    expect(getByText('Explore top automotive manufacturers')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    expect(getByTestId('brand-showcase')).toBeTruthy();
  });

  it('renders loading state correctly', () => {
    const { getByText, getAllByTestId } = render(
      <BrandShowcase {...defaultProps} loading={true} />,
    );

    expect(getByText('Most Popular')).toBeTruthy();
    expect(getByText('All Brands')).toBeTruthy();
    expect(getAllByTestId('featured-skeleton')).toHaveLength(3);
    expect(getAllByTestId('regular-skeleton')).toHaveLength(6);
  });

  it('renders empty state when no brands', () => {
    const { getByText } = render(
      <BrandShowcase {...defaultProps} brands={[]} />,
    );

    expect(getByText('No brands available')).toBeTruthy();
    expect(
      getByText("We're working on adding more car brands for you"),
    ).toBeTruthy();
  });

  it('calls onViewAll when View All button is pressed', () => {
    const { getByText } = render(<BrandShowcase {...defaultProps} />);

    fireEvent.press(getByText('View All'));
    expect(defaultProps.onViewAll).toHaveBeenCalledTimes(1);
  });

  it('calls onBrandPress when a brand is pressed', () => {
    const { getByText } = render(<BrandShowcase {...defaultProps} />);

    fireEvent.press(getByText('BMW'));
    expect(defaultProps.onBrandPress).toHaveBeenCalledWith('1');
  });

  it('displays featured brands correctly', () => {
    const { getByText } = render(<BrandShowcase {...defaultProps} />);

    // First 3 brands should be featured
    expect(getByText('BMW')).toBeTruthy();
    expect(getByText('Mercedes-Benz')).toBeTruthy();
    expect(getByText('Audi')).toBeTruthy();

    // Should show model counts for featured brands
    expect(getByText('25 models')).toBeTruthy();
    expect(getByText('30 models')).toBeTruthy();
    expect(getByText('20 models')).toBeTruthy();
  });

  it('displays regular brands correctly', () => {
    const { getByText } = render(<BrandShowcase {...defaultProps} />);

    // 4th brand should be in regular section
    expect(getByText('Toyota')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <BrandShowcase {...defaultProps} testID="custom-showcase" />,
    );

    expect(getByTestId('custom-showcase')).toBeTruthy();
  });
});
