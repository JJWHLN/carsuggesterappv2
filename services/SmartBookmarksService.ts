import { Car } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BookmarkAlert {
  id: string;
  carId: string;
  type: 'price_drop' | 'similar_car' | 'dealer_update' | 'expiring_soon';
  originalPrice?: number;
  currentPrice?: number;
  threshold?: number;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface SmartBookmark {
  id: string;
  car: Car;
  addedAt: string;
  lastViewed: string;
  viewCount: number;
  tags: string[];
  notes: string;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number; // Percentage decrease to trigger alert
  reminderDate?: string;
  priority: 'low' | 'medium' | 'high';
  dealerContacted: boolean;
  testDriveScheduled: boolean;
  financingInterest: boolean;
  customFields: { [key: string]: any };
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description: string;
  bookmarkIds: string[];
  createdAt: string;
  isShared: boolean;
  shareCode?: string;
  color: string;
  icon: string;
}

export interface BookmarkAnalytics {
  totalBookmarks: number;
  activeAlerts: number;
  averageTimeToContact: number; // days
  conversionRate: number; // percentage who contact dealer
  priceDropsSaved: number; // total money saved from alerts
  popularBrands: { brand: string; count: number }[];
  priceRangeDistribution: { range: string; count: number }[];
  bookmarkTrends: { date: string; count: number }[];
  alertEffectiveness: { type: string; actionRate: number }[];
}

export class SmartBookmarksService {
  private static instance: SmartBookmarksService;
  private bookmarks: Map<string, SmartBookmark> = new Map();
  private collections: Map<string, BookmarkCollection> = new Map();
  private alerts: BookmarkAlert[] = [];
  private isLoaded = false;

  static getInstance(): SmartBookmarksService {
    if (!SmartBookmarksService.instance) {
      SmartBookmarksService.instance = new SmartBookmarksService();
    }
    return SmartBookmarksService.instance;
  }

  private constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const [bookmarksData, collectionsData, alertsData] = await Promise.all([
        AsyncStorage.getItem('smart_bookmarks'),
        AsyncStorage.getItem('bookmark_collections'),
        AsyncStorage.getItem('bookmark_alerts'),
      ]);

      if (bookmarksData) {
        const bookmarksArray: SmartBookmark[] = JSON.parse(bookmarksData);
        bookmarksArray.forEach(bookmark => {
          this.bookmarks.set(bookmark.id, bookmark);
        });
      }

      if (collectionsData) {
        const collectionsArray: BookmarkCollection[] = JSON.parse(collectionsData);
        collectionsArray.forEach(collection => {
          this.collections.set(collection.id, collection);
        });
      }

      if (alertsData) {
        this.alerts = JSON.parse(alertsData);
      }

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load smart bookmarks data:', error);
      this.isLoaded = true;
    }
  }

  private async saveData(): Promise<void> {
    try {
      const bookmarksArray = Array.from(this.bookmarks.values());
      const collectionsArray = Array.from(this.collections.values());

      await Promise.all([
        AsyncStorage.setItem('smart_bookmarks', JSON.stringify(bookmarksArray)),
        AsyncStorage.setItem('bookmark_collections', JSON.stringify(collectionsArray)),
        AsyncStorage.setItem('bookmark_alerts', JSON.stringify(this.alerts)),
      ]);
    } catch (error) {
      console.error('Failed to save smart bookmarks data:', error);
    }
  }

  // Bookmark Management
  async addBookmark(
    car: Car,
    options: {
      tags?: string[];
      notes?: string;
      priceAlertEnabled?: boolean;
      priceAlertThreshold?: number;
      reminderDate?: string;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<SmartBookmark> {
    await this.loadData();

    const bookmark: SmartBookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      car,
      addedAt: new Date().toISOString(),
      lastViewed: new Date().toISOString(),
      viewCount: 1,
      tags: options.tags || [],
      notes: options.notes || '',
      priceAlertEnabled: options.priceAlertEnabled || false,
      priceAlertThreshold: options.priceAlertThreshold || 5, // 5% default
      reminderDate: options.reminderDate,
      priority: options.priority || 'medium',
      dealerContacted: false,
      testDriveScheduled: false,
      financingInterest: false,
      customFields: {},
    };

    this.bookmarks.set(bookmark.id, bookmark);
    await this.saveData();

    // Create welcome alert for first bookmark
    if (this.bookmarks.size === 1) {
      await this.createAlert({
        carId: car.id,
        type: 'similar_car',
        message: '🎉 Welcome to Smart Bookmarks! We\'ll notify you about price drops and similar cars.',
      });
    }

    return bookmark;
  }

  async removeBookmark(bookmarkId: string): Promise<boolean> {
    await this.loadData();

    const deleted = this.bookmarks.delete(bookmarkId);
    if (deleted) {
      // Remove bookmark from collections
      for (const collection of this.collections.values()) {
        const index = collection.bookmarkIds.indexOf(bookmarkId);
        if (index > -1) {
          collection.bookmarkIds.splice(index, 1);
        }
      }

      // Remove related alerts
      this.alerts = this.alerts.filter(alert => 
        alert.carId !== this.bookmarks.get(bookmarkId)?.car.id
      );

      await this.saveData();
    }

    return deleted;
  }

  async updateBookmark(bookmarkId: string, updates: Partial<SmartBookmark>): Promise<SmartBookmark | null> {
    await this.loadData();

    const bookmark = this.bookmarks.get(bookmarkId);
    if (!bookmark) return null;

    const updatedBookmark = { ...bookmark, ...updates };
    this.bookmarks.set(bookmarkId, updatedBookmark);
    await this.saveData();

    return updatedBookmark;
  }

  async recordBookmarkView(bookmarkId: string): Promise<void> {
    await this.loadData();

    const bookmark = this.bookmarks.get(bookmarkId);
    if (bookmark) {
      bookmark.lastViewed = new Date().toISOString();
      bookmark.viewCount += 1;
      await this.saveData();
    }
  }

  // Collection Management
  async createCollection(
    name: string,
    description: string = '',
    color: string = '#48cc6c',
    icon: string = 'bookmark'
  ): Promise<BookmarkCollection> {
    await this.loadData();

    const collection: BookmarkCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      bookmarkIds: [],
      createdAt: new Date().toISOString(),
      isShared: false,
      color,
      icon,
    };

    this.collections.set(collection.id, collection);
    await this.saveData();

    return collection;
  }

  async addToCollection(bookmarkId: string, collectionId: string): Promise<boolean> {
    await this.loadData();

    const collection = this.collections.get(collectionId);
    const bookmark = this.bookmarks.get(bookmarkId);

    if (!collection || !bookmark) return false;

    if (!collection.bookmarkIds.includes(bookmarkId)) {
      collection.bookmarkIds.push(bookmarkId);
      await this.saveData();
    }

    return true;
  }

  async removeFromCollection(bookmarkId: string, collectionId: string): Promise<boolean> {
    await this.loadData();

    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const index = collection.bookmarkIds.indexOf(bookmarkId);
    if (index > -1) {
      collection.bookmarkIds.splice(index, 1);
      await this.saveData();
      return true;
    }

    return false;
  }

  // Alert Management
  private async createAlert(options: {
    carId: string;
    type: BookmarkAlert['type'];
    message: string;
    originalPrice?: number;
    currentPrice?: number;
    threshold?: number;
    actionUrl?: string;
  }): Promise<BookmarkAlert> {
    const alert: BookmarkAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      carId: options.carId,
      type: options.type,
      originalPrice: options.originalPrice,
      currentPrice: options.currentPrice,
      threshold: options.threshold,
      message: options.message,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionUrl: options.actionUrl,
    };

    this.alerts.push(alert);
    await this.saveData();

    return alert;
  }

  async markAlertAsRead(alertId: string): Promise<boolean> {
    await this.loadData();

    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      await this.saveData();
      return true;
    }

    return false;
  }

  async dismissAlert(alertId: string): Promise<boolean> {
    await this.loadData();

    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index > -1) {
      this.alerts.splice(index, 1);
      await this.saveData();
      return true;
    }

    return false;
  }

  // Smart Features
  async checkForPriceDrops(updatedCar: Car): Promise<void> {
    await this.loadData();

    for (const bookmark of this.bookmarks.values()) {
      if (bookmark.car.id === updatedCar.id && bookmark.priceAlertEnabled) {
        const originalPrice = bookmark.car.price;
        const currentPrice = updatedCar.price;
        const threshold = bookmark.priceAlertThreshold || 5;
        const percentageDecrease = ((originalPrice - currentPrice) / originalPrice) * 100;

        if (percentageDecrease >= threshold) {
          await this.createAlert({
            carId: updatedCar.id,
            type: 'price_drop',
            originalPrice,
            currentPrice,
            threshold,
            message: `🎉 Great news! The ${updatedCar.make} ${updatedCar.model} you bookmarked dropped by €${(originalPrice - currentPrice).toLocaleString()} (${Math.round(percentageDecrease)}%)`,
            actionUrl: `/car/${updatedCar.id}`,
          });

          // Update the bookmark with new price
          bookmark.car = updatedCar;
        }
      }
    }

    await this.saveData();
  }

  getSimilarCarsForBookmarks(): Car[] {
    const bookmarkedCars = Array.from(this.bookmarks.values()).map(b => b.car);
    const similarCars: Car[] = [];

    // Simple similarity algorithm based on make, price range, and year
    bookmarkedCars.forEach(bookmarkedCar => {
      // This would typically call an API or more sophisticated matching
      // For now, we'll simulate finding similar cars
      const priceRange = bookmarkedCar.price * 0.2; // 20% price variance
      const yearRange = 2; // 2 year variance

      // In a real implementation, this would query the database
      // For demo purposes, we'll generate mock similar cars
    });

    return similarCars;
  }

  // Getters
  async getAllBookmarks(): Promise<SmartBookmark[]> {
    await this.loadData();
    return Array.from(this.bookmarks.values()).sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }

  async getBookmarksByCollection(collectionId: string): Promise<SmartBookmark[]> {
    await this.loadData();
    const collection = this.collections.get(collectionId);
    if (!collection) return [];

    return collection.bookmarkIds
      .map(id => this.bookmarks.get(id))
      .filter(Boolean) as SmartBookmark[];
  }

  async getBookmarksByTag(tag: string): Promise<SmartBookmark[]> {
    await this.loadData();
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.tags.includes(tag))
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  async getBookmarksByPriority(priority: 'low' | 'medium' | 'high'): Promise<SmartBookmark[]> {
    await this.loadData();
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.priority === priority)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  async getAllCollections(): Promise<BookmarkCollection[]> {
    await this.loadData();
    return Array.from(this.collections.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUnreadAlerts(): Promise<BookmarkAlert[]> {
    await this.loadData();
    return this.alerts
      .filter(alert => !alert.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllAlerts(): Promise<BookmarkAlert[]> {
    await this.loadData();
    return this.alerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Analytics
  async getBookmarkAnalytics(): Promise<BookmarkAnalytics> {
    await this.loadData();

    const bookmarks = Array.from(this.bookmarks.values());
    const totalBookmarks = bookmarks.length;
    const activeAlerts = this.alerts.filter(a => !a.isRead).length;

    // Calculate conversion metrics
    const contactedDealers = bookmarks.filter(b => b.dealerContacted).length;
    const conversionRate = totalBookmarks > 0 ? (contactedDealers / totalBookmarks) * 100 : 0;

    // Calculate average time to contact
    const contactedBookmarks = bookmarks.filter(b => b.dealerContacted);
    const averageTimeToContact = contactedBookmarks.length > 0 
      ? contactedBookmarks.reduce((sum, b) => {
          const addedDate = new Date(b.addedAt);
          const contactDate = new Date(); // Simplified - would track actual contact date
          return sum + (contactDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / contactedBookmarks.length
      : 0;

    // Calculate price drops saved
    const priceDropAlerts = this.alerts.filter(a => a.type === 'price_drop');
    const priceDropsSaved = priceDropAlerts.reduce((sum, alert) => {
      return sum + ((alert.originalPrice || 0) - (alert.currentPrice || 0));
    }, 0);

    // Brand popularity
    const brandCounts: { [key: string]: number } = {};
    bookmarks.forEach(b => {
      brandCounts[b.car.make] = (brandCounts[b.car.make] || 0) + 1;
    });
    const popularBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Price range distribution
    const priceRanges = [
      { range: 'Under €15k', min: 0, max: 15000 },
      { range: '€15k - €25k', min: 15000, max: 25000 },
      { range: '€25k - €35k', min: 25000, max: 35000 },
      { range: '€35k - €50k', min: 35000, max: 50000 },
      { range: 'Over €50k', min: 50000, max: Infinity },
    ];

    const priceRangeDistribution = priceRanges.map(range => ({
      range: range.range,
      count: bookmarks.filter(b => b.car.price >= range.min && b.car.price < range.max).length,
    }));

    // Bookmark trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookmarkTrends: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = bookmarks.filter(b => {
        const bookmarkDate = new Date(b.addedAt).toISOString().split('T')[0];
        return bookmarkDate === dateStr;
      }).length;

      bookmarkTrends.push({ date: dateStr, count });
    }

    // Alert effectiveness
    const alertTypes = ['price_drop', 'similar_car', 'dealer_update', 'expiring_soon'];
    const alertEffectiveness = alertTypes.map(type => {
      const typeAlerts = this.alerts.filter(a => a.type === type);
      const readAlerts = typeAlerts.filter(a => a.isRead);
      const actionRate = typeAlerts.length > 0 ? (readAlerts.length / typeAlerts.length) * 100 : 0;
      
      return { type, actionRate };
    });

    return {
      totalBookmarks,
      activeAlerts,
      averageTimeToContact: Math.round(averageTimeToContact),
      conversionRate: Math.round(conversionRate * 100) / 100,
      priceDropsSaved,
      popularBrands,
      priceRangeDistribution,
      bookmarkTrends,
      alertEffectiveness,
    };
  }

  isBookmarked(carId: string): boolean {
    return Array.from(this.bookmarks.values()).some(bookmark => bookmark.car.id === carId);
  }

  async getBookmarkForCar(carId: string): Promise<SmartBookmark | null> {
    await this.loadData();
    return Array.from(this.bookmarks.values()).find(bookmark => bookmark.car.id === carId) || null;
  }
}

export default SmartBookmarksService;
