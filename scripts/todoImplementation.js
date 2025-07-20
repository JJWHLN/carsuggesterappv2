#!/usr/bin/env node

/**
 * 🎯 TODO Feature Implementation Script
 * Implements high-priority TODO features for better user experience
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Starting TODO Feature Implementation...');

const projectRoot = process.cwd();

// Create bookmark/save functionality service
const bookmarkServiceContent = `/**
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
          id: \`save_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
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
`;

// Create share functionality service
const shareServiceContent = `/**
 * 📤 Share Service
 * Handles sharing cars and content across platforms
 */

import { Share, Platform } from 'react-native';

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  carData?: any;
}

class ShareService {
  private static instance: ShareService;
  
  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }
  
  async shareCar(carData: any): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        title: \`Check out this \${carData.year} \${carData.make} \${carData.model}\`,
        message: \`I found this amazing \${carData.year} \${carData.make} \${carData.model} on CarSuggester! \${carData.price ? \`Price: \${carData.price}\` : ''}\`,
        url: \`carsuggester://car/\${carData.id}\` // Deep link
      };
      
      return await this.share(shareContent);
    } catch (error) {
      console.error('Error sharing car:', error);
      return false;
    }
  }
  
  async shareSearchResults(query: string, resultsCount: number): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        title: 'Car Search Results',
        message: \`I found \${resultsCount} cars matching "\${query}" on CarSuggester! Check it out.\`,
        url: 'carsuggester://search?q=' + encodeURIComponent(query)
      };
      
      return await this.share(shareContent);
    } catch (error) {
      console.error('Error sharing search:', error);
      return false;
    }
  }
  
  async shareReview(reviewData: any): Promise<boolean> {
    try {
      const shareContent: ShareContent = {
        title: \`Car Review: \${reviewData.carMake} \${reviewData.carModel}\`,
        message: \`Check out this review of the \${reviewData.carMake} \${reviewData.carModel}: "\${reviewData.title}"\`,
        url: \`carsuggester://review/\${reviewData.id}\`
      };
      
      return await this.share(shareContent);
    } catch (error) {
      console.error('Error sharing review:', error);
      return false;
    }
  }
  
  private async share(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        title: content.title,
        message: Platform.OS === 'ios' ? content.message : \`\${content.message} \${content.url || ''}\`,
        url: Platform.OS === 'ios' ? content.url : undefined,
      };
      
      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        return true;
      } else if (result.action === Share.dismissedAction) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in share:', error);
      return false;
    }
  }
}

export const shareService = ShareService.getInstance();

// React Hook for share functionality
import { useState } from 'react';

export function useShare() {
  const [sharing, setSharing] = useState(false);
  
  const shareCar = async (carData: any) => {
    setSharing(true);
    try {
      const success = await shareService.shareCar(carData);
      return success;
    } finally {
      setSharing(false);
    }
  };
  
  const shareSearch = async (query: string, resultsCount: number) => {
    setSharing(true);
    try {
      const success = await shareService.shareSearchResults(query, resultsCount);
      return success;
    } finally {
      setSharing(false);
    }
  };
  
  const shareReview = async (reviewData: any) => {
    setSharing(true);
    try {
      const success = await shareService.shareReview(reviewData);
      return success;
    } finally {
      setSharing(false);
    }
  };
  
  return { sharing, shareCar, shareSearch, shareReview };
}
`;

// Create dealer contact service
const dealerContactServiceContent = `/**
 * 📞 Dealer Contact Service
 * Handles communication with car dealerships
 */

import { Linking, Alert, Platform } from 'react-native';

export interface DealerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

class DealerContactService {
  private static instance: DealerContactService;
  
  static getInstance(): DealerContactService {
    if (!DealerContactService.instance) {
      DealerContactService.instance = new DealerContactService();
    }
    return DealerContactService.instance;
  }
  
  async callDealer(dealerInfo: DealerInfo, carId?: string): Promise<boolean> {
    try {
      if (!dealerInfo.phone) {
        Alert.alert('No Phone Number', 'This dealer has not provided a phone number.');
        return false;
      }
      
      const phoneNumber = this.formatPhoneNumber(dealerInfo.phone);
      const canCall = await Linking.canOpenURL(\`tel:\${phoneNumber}\`);
      
      if (canCall) {
        Alert.alert(
          'Call Dealer',
          \`Call \${dealerInfo.name}?\${carId ? ' regarding this vehicle?' : ''}\`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call', 
              onPress: () => Linking.openURL(\`tel:\${phoneNumber}\`) 
            }
          ]
        );
        return true;
      } else {
        Alert.alert('Cannot Make Call', 'Phone calls are not supported on this device.');
        return false;
      }
    } catch (error) {
      console.error('Error calling dealer:', error);
      return false;
    }
  }
  
  async emailDealer(dealerInfo: DealerInfo, carId?: string): Promise<boolean> {
    try {
      if (!dealerInfo.email) {
        Alert.alert('No Email', 'This dealer has not provided an email address.');
        return false;
      }
      
      const subject = carId ? 
        \`Inquiry about vehicle \${carId}\` : 
        \`General inquiry - \${dealerInfo.name}\`;
        
      const body = carId ?
        \`Hi,\\n\\nI'm interested in learning more about vehicle \${carId}. Could you please provide more details?\\n\\nThank you!\` :
        \`Hi,\\n\\nI'd like to inquire about your available vehicles.\\n\\nThank you!\`;
      
      const emailUrl = \`mailto:\${dealerInfo.email}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
      
      const canEmail = await Linking.canOpenURL(emailUrl);
      if (canEmail) {
        await Linking.openURL(emailUrl);
        return true;
      } else {
        Alert.alert('Cannot Send Email', 'Email is not configured on this device.');
        return false;
      }
    } catch (error) {
      console.error('Error emailing dealer:', error);
      return false;
    }
  }
  
  async openDealerWebsite(dealerInfo: DealerInfo): Promise<boolean> {
    try {
      if (!dealerInfo.website) {
        Alert.alert('No Website', 'This dealer has not provided a website.');
        return false;
      }
      
      let url = dealerInfo.website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Cannot Open Website', 'Unable to open the dealer website.');
        return false;
      }
    } catch (error) {
      console.error('Error opening dealer website:', error);
      return false;
    }
  }
  
  async getDirections(dealerInfo: DealerInfo): Promise<boolean> {
    try {
      if (!dealerInfo.address) {
        Alert.alert('No Address', 'This dealer has not provided an address.');
        return false;
      }
      
      const address = encodeURIComponent(dealerInfo.address);
      const url = Platform.OS === 'ios' ? 
        \`maps://app?daddr=\${address}\` : 
        \`google.navigation:q=\${address}\`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to web maps
        const webUrl = \`https://maps.google.com/maps?daddr=\${address}\`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      return false;
    }
  }
  
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    
    return '+' + cleaned;
  }
}

export const dealerContactService = DealerContactService.getInstance();

// React Hook for dealer contact functionality
import { useState } from 'react';

export function useDealerContact() {
  const [contacting, setContacting] = useState(false);
  
  const callDealer = async (dealerInfo: DealerInfo, carId?: string) => {
    setContacting(true);
    try {
      const success = await dealerContactService.callDealer(dealerInfo, carId);
      return success;
    } finally {
      setContacting(false);
    }
  };
  
  const emailDealer = async (dealerInfo: DealerInfo, carId?: string) => {
    setContacting(true);
    try {
      const success = await dealerContactService.emailDealer(dealerInfo, carId);
      return success;
    } finally {
      setContacting(false);
    }
  };
  
  const openWebsite = async (dealerInfo: DealerInfo) => {
    return await dealerContactService.openDealerWebsite(dealerInfo);
  };
  
  const getDirections = async (dealerInfo: DealerInfo) => {
    return await dealerContactService.getDirections(dealerInfo);
  };
  
  return { contacting, callDealer, emailDealer, openWebsite, getDirections };
}
`;

// Write the services
fs.writeFileSync(path.join(projectRoot, 'services', 'bookmarkService.ts'), bookmarkServiceContent);
fs.writeFileSync(path.join(projectRoot, 'services', 'shareService.ts'), shareServiceContent);
fs.writeFileSync(path.join(projectRoot, 'services', 'dealerContactService.ts'), dealerContactServiceContent);

console.log('✅ Created bookmark service: services/bookmarkService.ts');
console.log('✅ Created share service: services/shareService.ts');
console.log('✅ Created dealer contact service: services/dealerContactService.ts');

// Track TODO implementations
const implementedFeatures = [
  {
    file: 'services/bookmarkService.ts',
    features: ['Car bookmarking', 'Save/unsave functionality', 'AsyncStorage persistence', 'Supabase sync']
  },
  {
    file: 'services/shareService.ts', 
    features: ['Car sharing', 'Search results sharing', 'Review sharing', 'Native share integration']
  },
  {
    file: 'services/dealerContactService.ts',
    features: ['Dealer phone calls', 'Email integration', 'Website opening', 'Directions/Maps']
  }
];

// Generate implementation report
const reportData = {
  timestamp: new Date().toISOString(),
  featuresImplemented: implementedFeatures.length * 4, // 4 features per service
  services: implementedFeatures,
  nextSteps: [
    'Update UI components to use new services',
    'Replace TODO comments with actual implementations',
    'Add error handling and loading states',
    'Test all new functionality'
  ]
};

fs.writeFileSync(
  path.join(projectRoot, 'todo-implementation-report.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('\n📊 TODO Implementation Summary:');
console.log(`✅ Services created: ${implementedFeatures.length}`);
console.log(`🎯 Features implemented: ${reportData.featuresImplemented}`);
console.log('📄 Report saved to: todo-implementation-report.json');

console.log('\n🎉 TODO implementation complete!');
console.log('🚀 Next: Update UI components to use new services');
