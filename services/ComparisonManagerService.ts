import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car } from '@/types/database';

interface ComparisonState {
  cars: Car[];
  history: ComparisonHistory[];
  favorites: string[];
}

interface ComparisonHistory {
  id: string;
  carIds: string[];
  carNames: string[];
  timestamp: Date;
  result?: 'selected' | 'saved' | 'shared';
}

interface ComparisonAnalytics {
  totalComparisons: number;
  averageCarsPerComparison: number;
  mostComparedFeatures: string[];
  popularCarPairs: Array<{ car1: string; car2: string; count: number }>;
  conversionRate: number;
}

class ComparisonManagerService {
  private static instance: ComparisonManagerService;
  private readonly STORAGE_KEY = '@car_comparison_state';
  private readonly MAX_COMPARISON_CARS = 3;
  private readonly MAX_HISTORY_ITEMS = 50;
  
  private state: ComparisonState = {
    cars: [],
    history: [],
    favorites: [],
  };

  static getInstance(): ComparisonManagerService {
    if (!ComparisonManagerService.instance) {
      ComparisonManagerService.instance = new ComparisonManagerService();
    }
    return ComparisonManagerService.instance;
  }

  private constructor() {
    this.loadState();
  }

  // State Management
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save comparison state:', error);
    }
  }

  private async loadState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Convert timestamp strings back to Date objects
        parsed.history = parsed.history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load comparison state:', error);
    }
  }

  // Comparison Management
  async addCarToComparison(car: Car): Promise<boolean> {
    if (this.state.cars.length >= this.MAX_COMPARISON_CARS) {
      return false;
    }

    // Check if car is already in comparison
    if (this.state.cars.some(c => c.id === car.id)) {
      return false;
    }

    this.state.cars.push(car);
    await this.saveState();
    return true;
  }

  async removeCarFromComparison(carId: string): Promise<void> {
    this.state.cars = this.state.cars.filter(car => car.id !== carId);
    await this.saveState();
  }

  async clearComparison(): Promise<void> {
    // Save to history before clearing
    if (this.state.cars.length > 1) {
      await this.addToHistory(this.state.cars);
    }
    
    this.state.cars = [];
    await this.saveState();
  }

  getComparisonCars(): Car[] {
    return [...this.state.cars];
  }

  getComparisonCount(): number {
    return this.state.cars.length;
  }

  canAddMore(): boolean {
    return this.state.cars.length < this.MAX_COMPARISON_CARS;
  }

  isInComparison(carId: string): boolean {
    return this.state.cars.some(car => car.id === carId);
  }

  // History Management
  private async addToHistory(cars: Car[], result?: 'selected' | 'saved' | 'shared'): Promise<void> {
    const historyItem: ComparisonHistory = {
      id: Date.now().toString(),
      carIds: cars.map(car => car.id),
      carNames: cars.map(car => `${car.make} ${car.model}`),
      timestamp: new Date(),
      result,
    };

    this.state.history.unshift(historyItem);
    
    // Keep only the most recent items
    if (this.state.history.length > this.MAX_HISTORY_ITEMS) {
      this.state.history = this.state.history.slice(0, this.MAX_HISTORY_ITEMS);
    }

    await this.saveState();
  }

  async markComparisonResult(result: 'selected' | 'saved' | 'shared'): Promise<void> {
    if (this.state.cars.length > 1) {
      await this.addToHistory(this.state.cars, result);
    }
  }

  getComparisonHistory(): ComparisonHistory[] {
    return [...this.state.history];
  }

  async clearHistory(): Promise<void> {
    this.state.history = [];
    await this.saveState();
  }

  // Favorites Management
  async addToFavorites(comparisonId: string): Promise<void> {
    if (!this.state.favorites.includes(comparisonId)) {
      this.state.favorites.push(comparisonId);
      await this.saveState();
    }
  }

  async removeFromFavorites(comparisonId: string): Promise<void> {
    this.state.favorites = this.state.favorites.filter(id => id !== comparisonId);
    await this.saveState();
  }

  isFavorite(comparisonId: string): boolean {
    return this.state.favorites.includes(comparisonId);
  }

  getFavoriteComparisons(): ComparisonHistory[] {
    return this.state.history.filter(item => this.isFavorite(item.id));
  }

  // Analytics & Insights
  getComparisonAnalytics(): ComparisonAnalytics {
    const history = this.state.history;
    const totalComparisons = history.length;
    
    if (totalComparisons === 0) {
      return {
        totalComparisons: 0,
        averageCarsPerComparison: 0,
        mostComparedFeatures: [],
        popularCarPairs: [],
        conversionRate: 0,
      };
    }

    // Calculate average cars per comparison
    const totalCars = history.reduce((sum, item) => sum + item.carIds.length, 0);
    const averageCarsPerComparison = totalCars / totalComparisons;

    // Calculate conversion rate (comparisons that resulted in action)
    const conversions = history.filter(item => item.result).length;
    const conversionRate = (conversions / totalComparisons) * 100;

    // Find popular car pairs
    const pairCounts: { [key: string]: number } = {};
    history.forEach(item => {
      if (item.carIds.length >= 2) {
        for (let i = 0; i < item.carIds.length; i++) {
          for (let j = i + 1; j < item.carIds.length; j++) {
            const pair = [item.carIds[i], item.carIds[j]].sort().join('-');
            pairCounts[pair] = (pairCounts[pair] || 0) + 1;
          }
        }
      }
    });

    const popularCarPairs = Object.entries(pairCounts)
      .map(([pair, count]) => {
        const [car1Id, car2Id] = pair.split('-');
        const historyItem1 = history.find(h => h.carIds.includes(car1Id));
        const historyItem2 = history.find(h => h.carIds.includes(car2Id));
        const car1Name = historyItem1?.carNames.find((_, i) => historyItem1.carIds[i] === car1Id) || car1Id;
        const car2Name = historyItem2?.carNames.find((_, i) => historyItem2.carIds[i] === car2Id) || car2Id;
        return { car1: car1Name, car2: car2Name, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalComparisons,
      averageCarsPerComparison: Math.round(averageCarsPerComparison * 10) / 10,
      mostComparedFeatures: ['price', 'fuel_type', 'year', 'mileage'], // This would be tracked separately
      popularCarPairs,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  // Smart Suggestions
  getSuggestedCarsForComparison(currentCars: Car[], allCars: Car[]): Car[] {
    if (currentCars.length === 0) {
      return [];
    }

    const currentCar = currentCars[0];
    const priceRange = currentCar.price * 0.2; // 20% price range
    
    // Find similar cars based on price, year, and fuel type
    const suggestions = allCars
      .filter(car => {
        // Exclude cars already in comparison
        if (currentCars.some(c => c.id === car.id)) return false;
        
        // Similar price range
        const priceDiff = Math.abs(car.price - currentCar.price);
        if (priceDiff > priceRange) return false;
        
        // Similar year (within 3 years)
        const yearDiff = Math.abs(car.year - currentCar.year);
        if (yearDiff > 3) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sort by relevance (price similarity)
        const aPriceDiff = Math.abs(a.price - currentCar.price);
        const bPriceDiff = Math.abs(b.price - currentCar.price);
        return aPriceDiff - bPriceDiff;
      })
      .slice(0, 5);

    return suggestions;
  }

  // Quick Comparison
  async quickCompare(car1: Car, car2: Car): Promise<{
    winner: Car | null;
    advantages: { car1: string[]; car2: string[] };
    neutral: string[];
  }> {
    const advantages = { car1: [] as string[], car2: [] as string[] };
    const neutral = [] as string[];
    let car1Score = 0;
    let car2Score = 0;

    // Price comparison (lower is better)
    if (car1.price < car2.price) {
      advantages.car1.push('Lower price');
      car1Score++;
    } else if (car2.price < car1.price) {
      advantages.car2.push('Lower price');
      car2Score++;
    } else {
      neutral.push('Same price');
    }

    // Year comparison (newer is better)
    if (car1.year > car2.year) {
      advantages.car1.push('Newer model');
      car1Score++;
    } else if (car2.year > car1.year) {
      advantages.car2.push('Newer model');
      car2Score++;
    } else {
      neutral.push('Same year');
    }

    // Mileage comparison (lower is better)
    if ((car1.mileage || 0) < (car2.mileage || 0)) {
      advantages.car1.push('Lower mileage');
      car1Score++;
    } else if ((car2.mileage || 0) < (car1.mileage || 0)) {
      advantages.car2.push('Lower mileage');
      car2Score++;
    } else {
      neutral.push('Similar mileage');
    }

    // Fuel type preference (electric > hybrid > others)
    const fuelTypeScore = (fuel: string | undefined) => {
      if (!fuel) return 0;
      const fuelLower = fuel.toLowerCase();
      if (fuelLower.includes('electric')) return 3;
      if (fuelLower.includes('hybrid')) return 2;
      return 1;
    };

    const car1FuelScore = fuelTypeScore(car1.fuel_type);
    const car2FuelScore = fuelTypeScore(car2.fuel_type);

    if (car1FuelScore > car2FuelScore) {
      advantages.car1.push('More eco-friendly fuel');
      car1Score++;
    } else if (car2FuelScore > car1FuelScore) {
      advantages.car2.push('More eco-friendly fuel');
      car2Score++;
    }

    // Determine winner
    let winner: Car | null = null;
    if (car1Score > car2Score) {
      winner = car1;
    } else if (car2Score > car1Score) {
      winner = car2;
    }

    // Track the comparison
    await this.addToHistory([car1, car2]);

    return { winner, advantages, neutral };
  }

  // Bulk Operations
  async replaceComparison(cars: Car[]): Promise<void> {
    if (cars.length > this.MAX_COMPARISON_CARS) {
      throw new Error(`Cannot compare more than ${this.MAX_COMPARISON_CARS} cars`);
    }

    // Save current comparison to history if it has cars
    if (this.state.cars.length > 1) {
      await this.addToHistory(this.state.cars);
    }

    this.state.cars = [...cars];
    await this.saveState();
  }

  async loadHistoryComparison(historyId: string): Promise<boolean> {
    const historyItem = this.state.history.find(item => item.id === historyId);
    if (!historyItem) {
      return false;
    }

    // You would need to fetch the actual car objects from your data service
    // For now, we'll just clear and let the caller handle loading the cars
    this.state.cars = [];
    await this.saveState();
    return true;
  }
}

export default ComparisonManagerService;
