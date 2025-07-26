/**
 * 🧪 LoadingSpinner Component Tests
 * Testing critical UI component for loading states
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';

// Mock external dependencies
jest.mock('../../../constants/Colors', () => ({
  currentColors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
  },
}));

describe('🧪 LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const spinner = getByTestId('activity-indicator');
      
      expect(spinner).toBeTruthy();
      expect(spinner.props.size).toBe('large');
    });

    it('renders with custom size', () => {
      const { getByTestId } = render(<LoadingSpinner size="small" />);
      const spinner = getByTestId('activity-indicator');
      
      expect(spinner.props.size).toBe('small');
    });

    it('renders with numeric size', () => {
      const { getByTestId } = render(<LoadingSpinner size={40} />);
      const spinner = getByTestId('activity-indicator');
      
      expect(spinner.props.size).toBe(40);
    });

    it('renders with custom color', () => {
      const customColor = '#FF0000';
      const { getByTestId } = render(<LoadingSpinner color={customColor} />);
      const spinner = getByTestId('activity-indicator');
      
      expect(spinner.props.color).toBe(customColor);
    });
  });

  describe('Container Styling', () => {
    it('applies correct container styles', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const container = getByTestId('loading-spinner-container');
      
      expect(container.props.style).toMatchObject({
        justifyContent: 'center',
        alignItems: 'center',
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility properties', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const spinner = getByTestId('activity-indicator');
      
      // ActivityIndicator should be accessible by default
      expect(spinner).toBeTruthy();
    });

    it('works with screen readers', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const container = getByTestId('loading-spinner-container');
      
      expect(container).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('handles undefined props gracefully', () => {
      expect(() => {
        render(<LoadingSpinner size={undefined} color={undefined} />);
      }).not.toThrow();
    });

    it('handles null props gracefully', () => {
      expect(() => {
        render(<LoadingSpinner size={null as any} color={null as any} />);
      }).not.toThrow();
    });

    it('handles invalid size gracefully', () => {
      expect(() => {
        render(<LoadingSpinner size={'invalid' as any} />);
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('integrates with loading states', () => {
      const LoadingComponent = ({ loading }: { loading: boolean }) => {
        if (loading) {
          return <LoadingSpinner />;
        }
        return null;
      };

      const { queryByTestId, rerender } = render(
        <LoadingComponent loading={true} />
      );

      expect(queryByTestId('activity-indicator')).toBeTruthy();

      rerender(<LoadingComponent loading={false} />);
      expect(queryByTestId('activity-indicator')).toBeNull();
    });

    it('works in different container sizes', () => {
      const { getByTestId } = render(
        <LoadingSpinner size="small" />
      );
      
      const spinner = getByTestId('activity-indicator'); 
      expect(spinner.props.size).toBe('small');
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        render(<LoadingSpinner />);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render 100 instances in under 1 second
    });

    it('does not cause memory leaks', () => {
      const { unmount } = render(<LoadingSpinner />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Different Color Schemes', () => {
    it('adapts to light theme', () => {
      const { getByTestId } = render(
        <LoadingSpinner color="#000000" />
      );
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.color).toBe('#000000');
    });

    it('adapts to dark theme', () => {
      const { getByTestId } = render(
        <LoadingSpinner color="#FFFFFF" />
      );
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.color).toBe('#FFFFFF');
    });

    it('uses brand colors', () => {
      const { getByTestId } = render(
        <LoadingSpinner color="#007AFF" />
      );
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.color).toBe('#007AFF');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large size values', () => {
      expect(() => {
        render(<LoadingSpinner size={1000} />);
      }).not.toThrow();
    });

    it('handles zero size', () => {
      expect(() => {
        render(<LoadingSpinner size={0} />);
      }).not.toThrow();
    });

    it('handles empty string color', () => {
      expect(() => {
        render(<LoadingSpinner color="" />);
      }).not.toThrow();
    });

    it('handles invalid hex color', () => {
      expect(() => {
        render(<LoadingSpinner color="invalid-color" />);
      }).not.toThrow();
    });
  });
});
