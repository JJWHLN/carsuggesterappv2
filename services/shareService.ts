/**
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
        title: `Check out this ${carData.year} ${carData.make} ${carData.model}`,
        message: `I found this amazing ${carData.year} ${carData.make} ${carData.model} on CarSuggester! ${carData.price ? `Price: ${carData.price}` : ''}`,
        url: `carsuggester://car/${carData.id}` // Deep link
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
        message: `I found ${resultsCount} cars matching "${query}" on CarSuggester! Check it out.`,
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
        title: `Car Review: ${reviewData.carMake} ${reviewData.carModel}`,
        message: `Check out this review of the ${reviewData.carMake} ${reviewData.carModel}: "${reviewData.title}"`,
        url: `carsuggester://review/${reviewData.id}`
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
        message: Platform.OS === 'ios' ? content.message : `${content.message} ${content.url || ''}`,
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
