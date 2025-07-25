import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ExtendedCar, ComparisonState, ComparisonActions, comparisonSections } from './types';

type ComparisonAction = 
  | { type: 'ADD_CAR'; payload: ExtendedCar }
  | { type: 'REMOVE_CAR'; payload: string }
  | { type: 'REORDER_CARS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'CLEAR_COMPARISON' }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'desktop' | 'mobile' }
  | { type: 'TOGGLE_DIFFERENCES_ONLY' }
  | { type: 'SET_SORT_BY'; payload: string | null }
  | { type: 'EXPAND_SECTION'; payload: string }
  | { type: 'COLLAPSE_SECTION'; payload: string };

const initialState: ComparisonState = {
  cars: [],
  maxCars: 4,
  selectedSections: comparisonSections.map(s => s.id),
  viewMode: 'desktop',
  showDifferencesOnly: false,
  sortBy: null,
  expandedSections: comparisonSections.filter(s => !s.collapsible).map(s => s.id),
};

function comparisonReducer(state: ComparisonState, action: ComparisonAction): ComparisonState {
  switch (action.type) {
    case 'ADD_CAR':
      if (state.cars.length >= state.maxCars) {
        console.warn(`Cannot add more than ${state.maxCars} cars for comparison`);
        return state;
      }
      if (state.cars.find(c => c.id === action.payload.id)) {
        console.warn('Car already in comparison');
        return state;
      }
      return { ...state, cars: [...state.cars, action.payload] };

    case 'REMOVE_CAR':
      return { ...state, cars: state.cars.filter(car => car.id !== action.payload) };

    case 'REORDER_CARS':
      const newCars = [...state.cars];
      const [movedCar] = newCars.splice(action.payload.fromIndex, 1);
      newCars.splice(action.payload.toIndex, 0, movedCar);
      return { ...state, cars: newCars };

    case 'CLEAR_COMPARISON':
      return { ...state, cars: [], sortBy: null };

    case 'TOGGLE_SECTION':
      return {
        ...state,
        selectedSections: state.selectedSections.includes(action.payload)
          ? state.selectedSections.filter(id => id !== action.payload)
          : [...state.selectedSections, action.payload],
      };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'TOGGLE_DIFFERENCES_ONLY':
      return { ...state, showDifferencesOnly: !state.showDifferencesOnly };

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };

    case 'EXPAND_SECTION':
      return {
        ...state,
        expandedSections: state.expandedSections.includes(action.payload)
          ? state.expandedSections
          : [...state.expandedSections, action.payload],
      };

    case 'COLLAPSE_SECTION':
      return {
        ...state,
        expandedSections: state.expandedSections.filter(id => id !== action.payload),
      };

    default:
      return state;
  }
}

const ComparisonContext = createContext<{
  state: ComparisonState;
  actions: ComparisonActions;
} | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(comparisonReducer, initialState);

  const actions: ComparisonActions = {
    addCar: (car: ExtendedCar) => dispatch({ type: 'ADD_CAR', payload: car }),
    removeCar: (carId: string) => dispatch({ type: 'REMOVE_CAR', payload: carId }),
    reorderCars: (fromIndex: number, toIndex: number) => 
      dispatch({ type: 'REORDER_CARS', payload: { fromIndex, toIndex } }),
    clearComparison: () => dispatch({ type: 'CLEAR_COMPARISON' }),
    toggleSection: (sectionId: string) => dispatch({ type: 'TOGGLE_SECTION', payload: sectionId }),
    setViewMode: (mode: 'desktop' | 'mobile') => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    toggleDifferencesOnly: () => dispatch({ type: 'TOGGLE_DIFFERENCES_ONLY' }),
    setSortBy: (field: string | null) => dispatch({ type: 'SET_SORT_BY', payload: field }),
    expandSection: (sectionId: string) => dispatch({ type: 'EXPAND_SECTION', payload: sectionId }),
    collapseSection: (sectionId: string) => dispatch({ type: 'COLLAPSE_SECTION', payload: sectionId }),
    
    exportToPDF: async () => {
      console.log('Exporting comparison to PDF for cars:', state.cars.map(c => c.id));
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('PDF export completed');
          resolve();
        }, 1000);
      });
    },

    shareComparison: async () => {
      const carIds = state.cars.map(c => c.id).join(',');
      const shareUrl = `${window.location.origin}/compare?cars=${carIds}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Car Comparison',
            text: `Compare these ${state.cars.length} cars`,
            url: shareUrl,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          console.log('Share URL copied to clipboard');
        } catch (error) {
          console.error('Error copying to clipboard:', error);
        }
      }
      
      return shareUrl;
    },
  };

  return (
    <ComparisonContext.Provider value={{ state, actions }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}

// Convenience hooks
export const useComparisonCars = () => useComparison().state.cars;
export const useComparisonCount = () => useComparison().state.cars.length;
export const useCanAddCar = () => {
  const { state } = useComparison();
  return state.cars.length < state.maxCars;
};
export const useIsCarInComparison = (carId: string) => {
  const { state } = useComparison();
  return state.cars.some(car => car.id === carId);
};
