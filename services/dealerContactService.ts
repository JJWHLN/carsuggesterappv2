/**
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
      const canCall = await Linking.canOpenURL(`tel:${phoneNumber}`);
      
      if (canCall) {
        Alert.alert(
          'Call Dealer',
          `Call ${dealerInfo.name}?${carId ? ' regarding this vehicle?' : ''}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call', 
              onPress: () => Linking.openURL(`tel:${phoneNumber}`) 
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
        `Inquiry about vehicle ${carId}` : 
        `General inquiry - ${dealerInfo.name}`;
        
      const body = carId ?
        `Hi,\n\nI'm interested in learning more about vehicle ${carId}. Could you please provide more details?\n\nThank you!` :
        `Hi,\n\nI'd like to inquire about your available vehicles.\n\nThank you!`;
      
      const emailUrl = `mailto:${dealerInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
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
        `maps://app?daddr=${address}` : 
        `google.navigation:q=${address}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to web maps
        const webUrl = `https://maps.google.com/maps?daddr=${address}`;
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
    const cleaned = phone.replace(/\D/g, '');
    
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
