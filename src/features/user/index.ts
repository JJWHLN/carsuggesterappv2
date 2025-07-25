// User profile and management components
export { UserProfile } from './UserProfile';
export { SavedSearches } from './SavedSearches';
export { Favorites } from './Favorites';
export { OnboardingQuiz } from './OnboardingQuiz';

// Re-export types for convenience
export type { 
  User, 
  UserPreferences, 
  SavedSearch, 
  SavedSearchAlert,
  FavoriteCar 
} from '../auth/types';
