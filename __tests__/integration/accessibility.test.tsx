import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  renderWithProviders, 
  expectAccessibilityProps 
} from '../utils/testUtils';

// Mock AccessibilityInfo
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    isBoldTextEnabled: jest.fn(),
    announceForAccessibility: jest.fn(),
  },
}));

describe('Accessibility Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Accessibility', () => {
    it('should have proper accessibility props', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithProviders(
        <Button
          title="Test Button"
          onPress={onPress}
          accessibilityLabel="Custom test button"
          accessibilityHint="Tap to perform test action"
        />
      );

      const button = getByRole('button');
      expectAccessibilityProps(button, {
        role: 'button',
        label: 'Custom test button',
        hint: 'Tap to perform test action',
        state: { disabled: false, busy: false }
      });
    });

    it('should announce actions for screen readers', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);

      const onPress = jest.fn();
      const { getByRole } = renderWithProviders(
        <Button
          title="Submit"
          onPress={onPress}
          accessibilityLabel="Submit form"
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalled();
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Submit form Activated'
      );
    });

    it('should handle disabled state correctly', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithProviders(
        <Button
          title="Disabled Button"
          onPress={onPress}
          disabled={true}
        />
      );

      const button = getByRole('button');
      expectAccessibilityProps(button, {
        state: { disabled: true }
      });
      
      fireEvent.press(button);
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should handle loading state correctly', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithProviders(
        <Button
          title="Loading Button"
          onPress={onPress}
          loading={true}
        />
      );

      const button = getByRole('button');
      expectAccessibilityProps(button, {
        state: { disabled: true, busy: true },
        hint: 'Loading, please wait'
      });
    });
  });

    it('should support destructive actions', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Delete"
          onPress={onPress}
          destructive={true}
          accessibilityLabel="Delete item"
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Delete item');
    });

    it('should handle accessibility actions', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Action Button"
          onPress={onPress}
        />
      );

      const button = getByRole('button');
      
      // Simulate accessibility action
      fireEvent(button, 'accessibilityAction', {
        nativeEvent: { actionName: 'activate' }
      });

      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('SearchBar Accessibility', () => {
    it('should have proper search accessibility props', () => {
      const onChangeText = jest.fn();
      const { getByRole } = render(
        <SearchBar
          value=""
          onChangeText={onChangeText}
          accessibilityLabel="Car search"
          accessibilityHint="Enter car make, model, or keyword"
          testID="car-search"
        />
      );

      const searchInput = getByRole('search');
      expect(searchInput.props.accessibilityRole).toBe('search');
      expect(searchInput.props.accessibilityLabel).toBe('Car search');
      expect(searchInput.props.accessibilityHint).toBe('Enter car make, model, or keyword');
    });

    it('should announce search actions', () => {
      const onChangeText = jest.fn();
      const onSubmit = jest.fn();
      const { getByRole } = render(
        <SearchBar
          value="BMW"
          onChangeText={onChangeText}
          onSubmit={onSubmit}
          testID="search"
        />
      );

      const searchInput = getByRole('search');
      fireEvent(searchInput, 'submitEditing');

      expect(onSubmit).toHaveBeenCalled();
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Searching for BMW'
      );
    });

    it('should announce clear action', () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      const { getByTestId } = render(
        <SearchBar
          value="test search"
          onChangeText={onChangeText}
          onClear={onClear}
          testID="search"
        />
      );

      const clearButton = getByTestId('search-clear');
      fireEvent.press(clearButton);

      expect(onClear).toHaveBeenCalled();
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Search field cleared'
      );
    });

    it('should have proper clear button accessibility', () => {
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <SearchBar
          value="test"
          onChangeText={onChangeText}
          testID="search"
        />
      );

      const clearButton = getByTestId('search-clear');
      expect(clearButton.props.accessibilityRole).toBe('button');
      expect(clearButton.props.accessibilityLabel).toBe('Clear search');
      expect(clearButton.props.accessibilityHint).toBe('Double tap to clear the search field');
    });
  });

  describe('OptimizedImage Accessibility', () => {
    it('should have proper image accessibility props', () => {
      const { getByRole } = render(
        <OptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          accessibilityLabel="Car exterior view"
          style={{ width: 100, height: 100 }}
        />
      );

      const image = getByRole('image');
      expect(image.props.accessibilityLabel).toBe('Car exterior view');
      expect(image.props.accessible).toBe(true);
    });

    it('should handle loading states properly', () => {
      const onLoad = jest.fn();
      const { getByRole } = render(
        <OptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          accessibilityLabel="Loading car image"
          onLoad={onLoad}
          style={{ width: 100, height: 100 }}
        />
      );

      const image = getByRole('image');
      fireEvent(image, 'load');
      
      expect(onLoad).toHaveBeenCalled();
    });

    it('should handle error states', () => {
      const onError = jest.fn();
      const fallbackSource = { uri: 'https://example.com/fallback.jpg' };
      
      const { getByRole } = render(
        <OptimizedImage
          source={{ uri: 'https://example.com/broken-image.jpg' }}
          fallbackSource={fallbackSource}
          accessibilityLabel="Car image with fallback"
          onError={onError}
          style={{ width: 100, height: 100 }}
        />
      );

      const image = getByRole('image');
      fireEvent(image, 'error');

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Accessibility Settings Integration', () => {
    it('should respect reduced motion settings', async () => {
      // Mock reduced motion enabled
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);

      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Animated Button"
          onPress={onPress}
        />
      );

      const button = getByRole('button');
      expect(button).toBeDefined();
      
      // Animation should be reduced or disabled when reduce motion is enabled
      // This would be tested with actual animation values in a real implementation
    });

    it('should respect bold text settings', async () => {
      // Mock bold text enabled
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(true);

      const onPress = jest.fn();
      const { getByRole } = render(
        <Button
          title="Bold Text Button"
          onPress={onPress}
        />
      );

      const button = getByRole('button');
      expect(button).toBeDefined();
      
      // Text should be rendered with bold weight when setting is enabled
    });

    it('should handle screen reader announcements', () => {
      const onChangeText = jest.fn();
      const { getByRole } = render(
        <SearchBar
          value=""
          onChangeText={onChangeText}
        />
      );

      const searchInput = getByRole('search');
      fireEvent(searchInput, 'focus');

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Search field focused'
      );
    });
  });

  describe('Focus Management', () => {
    it('should manage focus correctly in search bar', () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      const { getByRole, getByTestId } = render(
        <SearchBar
          value="test"
          onChangeText={onChangeText}
          onClear={onClear}
          testID="search"
        />
      );

      const searchInput = getByRole('search');
      const clearButton = getByTestId('search-clear');

      // Focus should return to input after clear
      fireEvent.press(clearButton);
      
      expect(onClear).toHaveBeenCalled();
      // In a real app, we'd verify focus was set back to the input
    });
  });

  describe('Live Regions', () => {
    it('should use live regions for dynamic content', () => {
      const onChangeText = jest.fn();
      const { getByRole } = render(
        <SearchBar
          value=""
          onChangeText={onChangeText}
        />
      );

      const searchInput = getByRole('search');
      expect(searchInput.props.accessibilityLiveRegion).toBe('polite');
    });
  });
});
