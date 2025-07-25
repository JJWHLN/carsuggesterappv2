import { Car } from '../recommendations/types';

export interface ExtendedCar extends Car {
  images: string[];
  msrp: number;
  marketPrice: number;
  depreciation: number;
  acceleration: number; // 0-60 mph
  horsepower: number;
  torque: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    cargoSpace: number;
    seatingCapacity: number;
  };
  safetyDetails: {
    overallRating: number;
    frontalCrash: number;
    sideCrash: number;
    rollover: number;
    pedestrianSafety: number;
  };
  featuresByCategory: {
    [category: string]: string[];
  };
  warranty: {
    basic: string;
    powertrain: string;
    corrosion: string;
    roadside: string;
  };
  reliabilityScore: number; // 0-100
  ownerSatisfaction: number; // 0-100
  resaleValue: number; // percentage
}

export interface ComparisonSection {
  id: string;
  title: string;
  icon: string;
  fields: ComparisonField[];
  collapsible: boolean;
}

export interface ComparisonField {
  id: string;
  label: string;
  key: keyof ExtendedCar | string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'rating' | 'array' | 'nested';
  unit?: string;
  format?: (value: any) => string;
  highlightBest?: boolean;
  highlightWorst?: boolean;
}

export interface ComparisonState {
  cars: ExtendedCar[];
  maxCars: number;
  selectedSections: string[];
  viewMode: 'desktop' | 'mobile';
  showDifferencesOnly: boolean;
  sortBy: string | null;
  expandedSections: string[];
}

export interface ComparisonActions {
  addCar: (car: ExtendedCar) => void;
  removeCar: (carId: string) => void;
  reorderCars: (fromIndex: number, toIndex: number) => void;
  clearComparison: () => void;
  toggleSection: (sectionId: string) => void;
  setViewMode: (mode: 'desktop' | 'mobile') => void;
  toggleDifferencesOnly: () => void;
  setSortBy: (field: string | null) => void;
  expandSection: (sectionId: string) => void;
  collapseSection: (sectionId: string) => void;
  exportToPDF: () => Promise<void>;
  shareComparison: () => Promise<string>;
}

export interface ComparisonStore extends ComparisonState, ComparisonActions {}

export const comparisonSections: ComparisonSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '🚗',
    collapsible: false,
    fields: [
      { id: 'make', label: 'Make', key: 'make', type: 'text' },
      { id: 'model', label: 'Model', key: 'model', type: 'text' },
      { id: 'year', label: 'Year', key: 'year', type: 'number' },
      { id: 'bodyStyle', label: 'Body Style', key: 'bodyStyle', type: 'text' },
    ],
  },
  {
    id: 'pricing',
    title: 'Price & Value',
    icon: '💰',
    collapsible: true,
    fields: [
      { id: 'msrp', label: 'MSRP', key: 'msrp', type: 'currency', highlightWorst: true },
      { id: 'marketPrice', label: 'Market Price', key: 'marketPrice', type: 'currency', highlightWorst: true },
      { id: 'depreciation', label: 'Depreciation', key: 'depreciation', type: 'percentage', unit: '%', highlightWorst: true },
      { id: 'resaleValue', label: 'Resale Value', key: 'resaleValue', type: 'percentage', unit: '%', highlightBest: true },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: '⚡',
    collapsible: true,
    fields: [
      { id: 'horsepower', label: 'Horsepower', key: 'horsepower', type: 'number', unit: 'hp', highlightBest: true },
      { id: 'torque', label: 'Torque', key: 'torque', type: 'number', unit: 'lb-ft', highlightBest: true },
      { id: 'acceleration', label: '0-60 mph', key: 'acceleration', type: 'number', unit: 's', highlightWorst: true },
      { id: 'fuelEfficiency', label: 'Fuel Economy', key: 'fuelEfficiency', type: 'number', unit: 'mpg', highlightBest: true },
    ],
  },
  {
    id: 'dimensions',
    title: 'Dimensions',
    icon: '📏',
    collapsible: true,
    fields: [
      { id: 'length', label: 'Length', key: 'dimensions.length', type: 'number', unit: 'in' },
      { id: 'width', label: 'Width', key: 'dimensions.width', type: 'number', unit: 'in' },
      { id: 'height', label: 'Height', key: 'dimensions.height', type: 'number', unit: 'in' },
      { id: 'cargoSpace', label: 'Cargo Space', key: 'dimensions.cargoSpace', type: 'number', unit: 'cu ft', highlightBest: true },
      { id: 'seatingCapacity', label: 'Seating', key: 'dimensions.seatingCapacity', type: 'number', unit: 'seats', highlightBest: true },
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: '🛡️',
    collapsible: true,
    fields: [
      { id: 'overallSafety', label: 'Overall Rating', key: 'safetyDetails.overallRating', type: 'rating', highlightBest: true },
      { id: 'frontalCrash', label: 'Frontal Crash', key: 'safetyDetails.frontalCrash', type: 'rating', highlightBest: true },
      { id: 'sideCrash', label: 'Side Crash', key: 'safetyDetails.sideCrash', type: 'rating', highlightBest: true },
      { id: 'rollover', label: 'Rollover', key: 'safetyDetails.rollover', type: 'rating', highlightBest: true },
      { id: 'pedestrianSafety', label: 'Pedestrian Safety', key: 'safetyDetails.pedestrianSafety', type: 'rating', highlightBest: true },
    ],
  },
  {
    id: 'warranty',
    title: 'Warranty & Reliability',
    icon: '🔧',
    collapsible: true,
    fields: [
      { id: 'basicWarranty', label: 'Basic Warranty', key: 'warranty.basic', type: 'text' },
      { id: 'powertrainWarranty', label: 'Powertrain', key: 'warranty.powertrain', type: 'text' },
      { id: 'reliabilityScore', label: 'Reliability Score', key: 'reliabilityScore', type: 'number', unit: '/100', highlightBest: true },
      { id: 'ownerSatisfaction', label: 'Owner Satisfaction', key: 'ownerSatisfaction', type: 'number', unit: '/100', highlightBest: true },
    ],
  },
];
