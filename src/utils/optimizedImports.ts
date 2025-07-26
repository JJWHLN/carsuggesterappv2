/**
 * 🌳 Import Optimization System
 * Tree-shaking friendly imports and barrel export elimination
 */

// ===== OPTIMIZED COMPONENT EXPORTS =====
// Direct exports instead of barrel exports to enable tree-shaking

// Core UI Components (src/components/common)
export { Button } from '../components/common/Button';
export { Card } from '../components/common/Card';
export { LoadingSpinner } from '../components/common/LoadingSpinner';
export { LoadingState } from '../components/common/LoadingState';
export { ErrorState } from '../components/common/ErrorState';
export { EmptyState } from '../components/common/EmptyState';

// Feature Components (src/features)
export { CarCard } from '../features/cars/CarCard';
export { ModelCard } from '../features/cars/ModelCard';
export { ReviewCard } from '../features/cars/ReviewCard';

// Search Components
export { AdvancedSearchFilters } from '../features/search/AdvancedSearchFilters';
export { EnhancedSearchBar } from '../features/search/EnhancedSearchBar';
export { ModernSearchBar } from '../features/search/ModernSearchBar';
export { SearchFiltersPanel } from '../features/search/SearchFiltersPanel';
export { SearchResults } from '../features/search/SearchResults';
export { SearchSuggestions } from '../features/search/SearchSuggestions';

// Comparison Components
export { CarComparison } from '../features/comparison/CarComparison';
export { SmartCarComparison } from '../features/comparison/SmartCarComparison';
export { ComparisonDrawer } from '../features/comparison/ComparisonDrawer';
export { ComparisonTable } from '../features/comparison/ComparisonTable';

// ===== OPTIMIZED HOOK EXPORTS =====
export { useUnifiedDataFetching } from '../hooks/useUnifiedDataFetching';
export { useDesignSystem } from '../hooks/useDesignSystem';
export { useConsolidatedTheme } from '../hooks/useConsolidatedTheme';
export { useAnalytics } from '../hooks/useAnalytics';
export { useDebounce } from '../hooks/useDebounce';

// ===== OPTIMIZED SERVICE EXPORTS =====
export { supabaseService } from '../services/supabaseService';
export { analyticsService } from '../services/analyticsService';
export { featureServices } from '../services/featureServices';

// ===== OPTIMIZED STORE EXPORTS =====
export { useCarStore } from '../store/useCarStore';
export { useSearchStore } from '../store/useSearchStore';
export { useUserStore } from '../store/useUserStore';
export { useUIStore } from '../store/useUIStore';

// ===== OPTIMIZED TYPE EXPORTS =====
export type {
  Car,
  UserPreferences,
  Recommendation,
} from '../features/recommendations/types';
export type { DatabaseVehicleListing } from '../types/database';
export type {
  SearchFilters,
  SearchResults as SearchResultsType,
} from '../features/search/types';

// ===== UTILITY EXPORTS =====
export { formatters } from '../utils/formatters';
export { validation } from '../utils/validation';
export { logger } from '../utils/logger';
export { performanceMonitor } from '../utils/performanceMonitor';

/**
 * 🚫 ANTI-PATTERNS TO AVOID:
 *
 * ❌ Barrel exports that import everything:
 * export * from './components';
 * export * from './hooks';
 *
 * ❌ Default exports for libraries:
 * export { default as lodash } from 'lodash';
 *
 * ❌ Deep imports from node_modules:
 * import { debounce } from 'lodash/debounce';
 *
 * ✅ PREFERRED PATTERNS:
 *
 * ✅ Named exports:
 * export { Button } from './Button';
 *
 * ✅ Specific imports:
 * import { debounce } from 'lodash-es';
 *
 * ✅ Tree-shakeable imports:
 * import { Button, Card } from '@/components/optimized';
 */

// ===== TREE-SHAKING OPTIMIZATION HELPERS =====

/**
 * Dynamically import only used components
 */
export const importOnlyUsed = <T extends Record<string, any>>(
  modulePromise: Promise<T>,
  usedKeys: (keyof T)[],
): Promise<Pick<T, keyof T>> => {
  return modulePromise.then((module) => {
    const result = {} as Pick<T, keyof T>;
    usedKeys.forEach((key) => {
      if (key in module) {
        result[key] = module[key];
      }
    });
    return result;
  });
};

/**
 * Create tree-shakeable re-exports
 */
export const createOptimizedExports = <T extends Record<string, any>>(
  exports: T,
): T => {
  // In development, warn about unused exports
  if (__DEV__) {
    const usedExports = new Set<string>();

    return new Proxy(exports, {
      get(target, prop: string) {
        usedExports.add(prop);
        return target[prop];
      },
    });
  }

  return exports;
};
