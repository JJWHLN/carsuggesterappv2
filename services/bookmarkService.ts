/**
 * 📌 Bookmark/Save Service
 * Handles saving and managing user's favorite cars
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface SavedCar {
  id: string;
  carId: string;
  userId?: string;
  savedAt: string;
  carData?: any; // Cache car data for offline access
}

class BookmarkService {
  private static instance: BookmarkService;
  private readonly STORAGE_KEY = '@saved_cars';
  
  static getInstance(): BookmarkService {
    if (!BookmarkService.instance) {
      BookmarkService.instance = new BookmarkService();
    }
    return BookmarkService.instance;
  }
  
  async saveCar(carId: string, carData?: any): Promise<boolean> {
    try {
      const savedCars = await this.getSavedCars();
      const isAlreadySaved = savedCars.some(car => car.carId === carId);
      
      if (!isAlreadySaved) {
        const newSave: SavedCar = {
          id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          carId,
          savedAt: new Date().toISOString(),
          carData
        };
        
        savedCars.push(newSave);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedCars));
        
        // Also save to Supabase if user is logged in
        await this.syncToSupabase(newSave);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving car:', error);
      return false;
    }
  }
  
  async unsaveCar(carId: string): Promise<boolean> {
    try {
      const savedCars = await this.getSavedCars();
      const filteredCars = savedCars.filter(car => car.carId !== carId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCars));
      
      // Remove from Supabase
      await this.removeFromSupabase(carId);
      
      return true;
    } catch (error) {
      console.error('Error unsaving car:', error);
      return false;
    }
  }
  
  async isCarSaved(carId: string): Promise<boolean> {
    try {
      const savedCars = await this.getSavedCars();
      return savedCars.some(car => car.carId === carId);
    } catch (error) {
      console.error('Error checking if car is saved:', error);
      return false;
    }
  }
  
  async getSavedCars(): Promise<SavedCar[]> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting saved cars:', error);
      return [];
    }
  }
  
  private async syncToSupabase(savedCar: SavedCar): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saved_cars').insert({
          id: savedCar.id,
          user_id: user.id,
          car_id: savedCar.carId,
          saved_at: savedCar.savedAt
        });
      }
    } catch (error) {
      console.warn('Could not sync to Supabase:', error);
    }
  }
  
  private async removeFromSupabase(carId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saved_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);
      }
    } catch (error) {
      console.warn('Could not remove from Supabase:', error);
    }
  }
}

export const bookmarkService = BookmarkService.getInstance();

// React Hook for bookmark functionality
import { useState, useEffect } from 'react';

export function useBookmark(carId: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    checkSavedStatus();
  }, [carId]);
  
  const checkSavedStatus = async () => {
    const saved = await bookmarkService.isCarSaved(carId);
    setIsSaved(saved);
  };
  
  const toggleSave = async (carData?: any) => {
    setLoading(true);
    try {
      if (isSaved) {
        await bookmarkService.unsaveCar(carId);
        setIsSaved(false);
      } else {
        await bookmarkService.saveCar(carId, carData);
        setIsSaved(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return { isSaved, loading, toggleSave };
}
