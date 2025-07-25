// Main comparison components
export { ComparisonScreen } from './ComparisonScreen';
export { ComparisonTable } from './ComparisonTable';
export { ComparisonDrawer } from './ComparisonDrawer';

// Context and hooks
export { 
  ComparisonProvider, 
  useComparison,
  useComparisonCars,
  useComparisonCount,
  useCanAddCar,
  useIsCarInComparison 
} from './ComparisonContext';

// Types
export type {
  ExtendedCar,
  ComparisonSection,
  ComparisonField,
  ComparisonState,
  ComparisonActions
} from './types';

export { comparisonSections } from './types';
