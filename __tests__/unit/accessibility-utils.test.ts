import { 
  createSemanticProps, 
  createListItemProps 
} from '@/hooks/useAccessibility';

// Mock React Native AccessibilityInfo
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
    isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
    isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
    setAccessibilityFocus: jest.fn(),
  },
}));

describe('Accessibility Utilities', () => {
  describe('createSemanticProps', () => {
    it('should create basic accessibility props', () => {
      const props = createSemanticProps('Test Button', 'button');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityLabel: 'Test Button',
        accessibilityRole: 'button',
        accessibilityHint: undefined,
        accessibilityValue: undefined,
        accessibilityState: {
          disabled: false,
          selected: false,
          expanded: false,
          checked: false,
          busy: false,
        },
      });
    });

    it('should create props with hint and value', () => {
      const props = createSemanticProps('Search', 'search', {
        hint: 'Enter search terms',
        value: 'BMW',
      });
      
      expect(props).toEqual({
        accessible: true,
        accessibilityLabel: 'Search',
        accessibilityRole: 'search',
        accessibilityHint: 'Enter search terms',
        accessibilityValue: { text: 'BMW' },
        accessibilityState: {
          disabled: false,
          selected: false,
          expanded: false,
          checked: false,
          busy: false,
        },
      });
    });

    it('should handle disabled state', () => {
      const props = createSemanticProps('Disabled Button', 'button', {
        disabled: true,
      });
      
      expect(props.accessibilityState.disabled).toBe(true);
    });

    it('should handle selected state', () => {
      const props = createSemanticProps('Tab Item', 'button', {
        selected: true,
      });
      
      expect(props.accessibilityState.selected).toBe(true);
    });

    it('should handle expanded state', () => {
      const props = createSemanticProps('Menu', 'button', {
        expanded: true,
      });
      
      expect(props.accessibilityState.expanded).toBe(true);
    });

    it('should handle checked state', () => {
      const props = createSemanticProps('Checkbox', 'button', {
        checked: true,
      });
      
      expect(props.accessibilityState.checked).toBe(true);
    });

    it('should handle busy state', () => {
      const props = createSemanticProps('Loading Button', 'button', {
        busy: true,
      });
      
      expect(props.accessibilityState.busy).toBe(true);
    });

    it('should handle all roles', () => {
      const roles = ['button', 'link', 'text', 'header', 'image', 'none', 'search', 'summary'];
      
      roles.forEach(role => {
        const props = createSemanticProps('Test', role as any);
        expect(props.accessibilityRole).toBe(role);
      });
    });
  });

  describe('createListItemProps', () => {
    it('should create list item props with position', () => {
      const props = createListItemProps('Car Item', { setIndex: 1, setSize: 10 });
      
      expect(props).toEqual({
        accessible: true,
        accessibilityLabel: 'Car Item',
        accessibilityRole: 'button',
        accessibilityHint: undefined,
        accessibilityValue: { text: '1 of 10' },
        accessibilityState: {
          disabled: false,
          selected: false,
          expanded: false,
          checked: false,
          busy: false,
        },
        accessibilityElementsHidden: false,
        importantForAccessibility: 'yes',
        accessibilityLiveRegion: 'polite',
      });
    });

    it('should handle selected list item', () => {
      const props = createListItemProps('Selected Car', { setIndex: 2, setSize: 5 }, {
        selected: true,
      });
      
      expect(props.accessibilityState.selected).toBe(true);
      expect(props.accessibilityValue.text).toBe('2 of 5');
    });

    it('should handle disabled list item', () => {
      const props = createListItemProps('Disabled Car', { setIndex: 3, setSize: 8 }, {
        disabled: true,
      });
      
      expect(props.accessibilityState.disabled).toBe(true);
    });

    it('should include hint when provided', () => {
      const props = createListItemProps('Car with details', { setIndex: 1, setSize: 3 }, {
        hint: 'Tap to view car details',
      });
      
      expect(props.accessibilityHint).toBe('Tap to view car details');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined options', () => {
      const props = createSemanticProps('Test', 'button', undefined);
      
      expect(props.accessibilityState).toEqual({
        disabled: false,
        selected: false,
        expanded: false,
        checked: false,
        busy: false,
      });
    });

    it('should handle empty label', () => {
      const props = createSemanticProps('', 'button');
      
      expect(props.accessibilityLabel).toBe('');
    });

    it('should handle zero position in list', () => {
      const props = createListItemProps('First Item', { setIndex: 0, setSize: 5 });
      
      expect(props.accessibilityValue.text).toBe('0 of 5');
    });

    it('should handle single item list', () => {
      const props = createListItemProps('Only Item', { setIndex: 1, setSize: 1 });
      
      expect(props.accessibilityValue.text).toBe('1 of 1');
    });
  });

  describe('Accessibility best practices', () => {
    it('should ensure all buttons have accessible role', () => {
      const props = createSemanticProps('Action', 'button');
      
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('button');
    });

    it('should ensure search elements have proper role', () => {
      const props = createSemanticProps('Search Cars', 'search');
      
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('search');
    });

    it('should ensure headers have proper role', () => {
      const props = createSemanticProps('Section Title', 'header');
      
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('header');
    });

    it('should provide meaningful value text for interactive elements', () => {
      const props = createSemanticProps('Toggle', 'button', {
        value: 'enabled',
        checked: true,
      });
      
      expect(props.accessibilityValue?.text).toBe('enabled');
      expect(props.accessibilityState.checked).toBe(true);
    });
  });
});
