/**
 * Unified Components Index
 *
 * This file consolidates all the unified components that replace multiple
 * duplicate components throughout the codebase.
 *
 * MIGRATION GUIDE:
 * ===============
 *
 * 1. Search Components:
 *    - Old: SearchBar, DebouncedSearch, AdvancedSearch, ModernSearchBar, etc.
 *    - New: UnifiedSearchComponent (with different modes)
 *    - Import: import { UnifiedSearchComponent as SearchBar } from '@/components/ui/unified'
 *
 * 2. Car Card Components:
 *    - Old: CarCard, PremiumCarCard, ModernCarCard, UltraPremiumCarCard, OptimizedCarCard, etc.
 *    - New: UnifiedCarCard (with different variants)
 *    - Import: import { UnifiedCarCard as CarCard } from '@/components/ui/unified'
 *
 * 3. Filter Components:
 *    - Old: FilterPanel, AdvancedSearchFilters, SmartFilters, etc.
 *    - New: UnifiedFilterPanel (with different variants)
 *    - Import: import { UnifiedFilterPanel as FilterPanel } from '@/components/ui/unified'
 *
 * 4. Modal Components:
 *    - Old: ContactDealerModal, PriceAlertModal, LoginModal, etc.
 *    - New: UnifiedModal (with different variants and content slots)
 *    - Import: import { UnifiedModal as Modal } from '@/components/ui/unified'
 */

// Export unified components
export {
  UnifiedSearchComponent,
  UnifiedSearchComponent as SearchComponent,
  UnifiedSearchComponent as SearchBar,
  UnifiedSearchComponent as DebouncedSearch,
  UnifiedSearchComponent as AdvancedSearch,
  useOptimizedSearch,
} from './UnifiedSearchComponent';

export {
  UnifiedCarCard,
  UnifiedCarCard as CarCard,
  UnifiedCarCard as PremiumCarCard,
  UnifiedCarCard as ModernCarCard,
  UnifiedCarCard as OptimizedCarCard,
} from './UnifiedCarCard';

export {
  UnifiedFilterPanel,
  UnifiedFilterPanel as FilterPanel,
  UnifiedFilterPanel as AdvancedSearchFilters,
  UnifiedFilterPanel as SmartFilters,
} from './UnifiedFilterPanel';

export {
  UnifiedModal,
  UnifiedModal as Modal,
  UnifiedModal as ContactDealerModal,
  UnifiedModal as PriceAlertModal,
  UnifiedModal as LoginModal,
} from './UnifiedModal';

// Re-export existing components that don't need consolidation
export { OptimizedImage } from '../OptimizedImage';
export { AnimatedPressable } from '../AnimatedPressable';
export { Button } from '../Button';
export { Card } from '../Card';
export { LoadingSpinner } from '../LoadingSpinner';
export { ErrorState } from '../ErrorState';
export { EmptyState } from '../EmptyState';

/**
 * Migration Helper Functions
 *
 * These functions help migrate existing component usage to the new unified components
 */

// Search component migration helpers
export const createSearchBarProps = (oldProps: any) => ({
  ...oldProps,
  mode: 'basic' as const,
  variant: 'standard' as const,
});

export const createDebouncedSearchProps = (oldProps: any) => ({
  ...oldProps,
  mode: 'debounced' as const,
  debounceMs: oldProps.debounceMs || 300,
});

export const createAdvancedSearchProps = (oldProps: any) => ({
  ...oldProps,
  mode: 'advanced' as const,
  showFilterButton: true,
  showQuickFilters: true,
});

// Car card migration helpers
export const createCarCardProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'standard' as const,
});

export const createPremiumCarCardProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'premium' as const,
  showFeatures: true,
  showRating: true,
});

export const createOptimizedCarCardProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'optimized' as const,
  priority: oldProps.priority || false,
});

// Filter panel migration helpers
export const createFilterPanelProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'modal' as const,
});

export const createBottomSheetFilterProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'bottom-sheet' as const,
});

// Modal migration helpers
export const createModalProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'default' as const,
});

export const createContactDealerModalProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'default' as const,
  title: 'Contact Dealer',
  showHeader: true,
});

export const createPriceAlertModalProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'default' as const,
  title: 'Set Price Alert',
  showHeader: true,
});

export const createLoginModalProps = (oldProps: any) => ({
  ...oldProps,
  variant: 'center' as const,
  title: 'Sign In',
  size: 'medium' as const,
});

/**
 * Component Replacement Map
 *
 * Use this to systematically replace old components with new unified ones
 */
export const COMPONENT_REPLACEMENTS = {
  // Search components
  SearchBar: 'UnifiedSearchComponent',
  DebouncedSearch: 'UnifiedSearchComponent',
  AdvancedSearch: 'UnifiedSearchComponent',
  ModernSearchBar: 'UnifiedSearchComponent',
  EnhancedSearchBar: 'UnifiedSearchComponent',
  SmartSearchBar: 'UnifiedSearchComponent',
  ComprehensiveSearch: 'UnifiedSearchComponent',

  // Card components
  CarCard: 'UnifiedCarCard',
  PremiumCarCard: 'UnifiedCarCard',
  ModernCarCard: 'UnifiedCarCard',
  UltraPremiumCarCard: 'UnifiedCarCard',
  OptimizedCarCard: 'UnifiedCarCard',
  EnhancedCarCard: 'UnifiedCarCard',
  VehicleCard: 'UnifiedCarCard',
  AutoCard: 'UnifiedCarCard',

  // Filter components
  FilterPanel: 'UnifiedFilterPanel',
  AdvancedSearchFilters: 'UnifiedFilterPanel',
  SmartFilters: 'UnifiedFilterPanel',
  SearchFiltersPanel: 'UnifiedFilterPanel',
  FilterBottomSheet: 'UnifiedFilterPanel',
  MultiSelectFilter: 'UnifiedFilterPanel',

  // Modal components
  ContactDealerModal: 'UnifiedModal',
  PriceAlertModal: 'UnifiedModal',
  LoginModal: 'UnifiedModal',
  SignUpModal: 'UnifiedModal',
  ForgotPasswordModal: 'UnifiedModal',
} as const;

/**
 * Prop Migration Map
 *
 * Maps old component props to new unified component props
 */
export const PROP_MIGRATIONS = {
  // Search component prop migrations
  SearchBar: {
    onSearchTextChange: 'onChangeText',
    searchText: 'value',
    showAI: 'showAIIcon',
    isLoading: 'loading',
  },

  // Car card prop migrations
  CarCard: {
    vehicle: 'car',
    onPress: 'onPress',
    onSavePress: 'onSave',
    saved: 'isSaved',
    showSave: 'showSaveButton',
  },

  // Filter panel prop migrations
  FilterPanel: {
    isVisible: 'visible',
    onDismiss: 'onClose',
    filterConfig: 'filters',
    selectedFilters: 'values',
    onFilterChange: 'onValuesChange',
  },

  // Modal prop migrations
  Modal: {
    isVisible: 'visible',
    onDismiss: 'onClose',
    modalTitle: 'title',
    content: 'children',
  },
} as const;
