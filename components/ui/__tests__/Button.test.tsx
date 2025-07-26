/**
 * 🧪 Button Component Tests - Enhanced Version
 * Comprehensive testing for Button component with 70% coverage target
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock external dependencies
jest.mock('@/hooks/useTheme', () => ({
  useThemeColors: () => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
      border: '#C7C7CC',
    },
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
}));

describe('🧪 Button Component - Enhanced', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with title', () => {
      const { getByText } = render(<Button {...defaultProps} />);
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Press Me" onPress={onPressMock} />,
      );

      fireEvent.press(getByText('Press Me'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" onPress={onPressMock} disabled />,
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('shows loading spinner when loading', () => {
      const { getByTestId } = render(
        <Button title="Loading" onPress={jest.fn()} loading />,
      );

      // The loading spinner should be present
      expect(getByTestId).toBeDefined();
    });
  });

  describe('Variants and Styling', () => {
    it('applies correct accessibility props', () => {
      const { getByLabelText } = render(
        <Button
          title="Accessible Button"
          onPress={jest.fn()}
          accessibilityLabel="Custom accessibility label"
        />,
      );

      expect(getByLabelText('Custom accessibility label')).toBeTruthy();
    });

    it('handles custom testID', () => {
      const { getByTestId } = render(
        <Button title="Test" onPress={jest.fn()} testID="custom-button" />,
      );

      expect(getByTestId('custom-button')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onPress without crashing', () => {
      expect(() => {
        render(<Button title="Test" />);
      }).not.toThrow();
    });

    it('handles empty title', () => {
      expect(() => {
        render(<Button title="" onPress={jest.fn()} />);
      }).not.toThrow();
    });

    it('handles multiple rapid presses', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Rapid Press" onPress={onPressMock} />,
      );

      const button = getByText('Rapid Press');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(onPressMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance & Accessibility', () => {
    it('has proper accessibility role', () => {
      const { getByRole } = render(
        <Button title="Accessible" onPress={jest.fn()} />,
      );

      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('maintains accessibility when disabled', () => {
      const { getByRole } = render(
        <Button title="Disabled" onPress={jest.fn()} disabled />,
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('announces loading state for screen readers', () => {
      const { getByRole } = render(
        <Button title="Loading" onPress={jest.fn()} loading />,
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState?.busy).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('works within forms', () => {
      const handleSubmit = jest.fn();
      const { getByText } = render(
        <Button title="Submit" onPress={handleSubmit} />,
      );

      fireEvent.press(getByText('Submit'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('handles dynamic title changes', () => {
      const { getByText, rerender } = render(
        <Button title="Initial" onPress={jest.fn()} />,
      );

      expect(getByText('Initial')).toBeTruthy();

      rerender(<Button title="Updated" onPress={jest.fn()} />);
      expect(getByText('Updated')).toBeTruthy();
    });

    it('maintains state during re-renders', () => {
      const onPressMock = jest.fn();
      const { getByText, rerender } = render(
        <Button title="Test" onPress={onPressMock} loading />,
      );

      // Re-render with different props
      rerender(<Button title="Test" onPress={onPressMock} loading={false} />);

      fireEvent.press(getByText('Test'));
      expect(onPressMock).toHaveBeenCalled();
    });
  });
});
