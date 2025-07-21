import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Dealer Profile and Verification Types
export interface DealerProfile {
  id: string;
  name: string;
  businessName: string;
  licenseNumber: string;
  verified: boolean;
  verificationLevel: 'basic' | 'premium' | 'elite';
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  businessHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  specialties: string[];
  certifications: string[];
  languages: string[];
  profileImage?: string;
  bannerImage?: string;
  description: string;
  yearEstablished: number;
  teamSize: number;
  serviceAreas: string[];
  paymentMethods: string[];
  financingOptions: string[];
  warranties: string[];
  services: {
    sales: boolean;
    financing: boolean;
    tradein: boolean;
    inspection: boolean;
    delivery: boolean;
    warranty: boolean;
    maintenance: boolean;
  };
  rating: {
    overall: number;
    communication: number;
    pricing: number;
    service: number;
    reliability: number;
    totalReviews: number;
  };
  badges: string[];
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  inventory: {
    totalCars: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    popularMakes: string[];
  };
  performance: {
    responseTime: number; // hours
    viewToLeadConversion: number; // percentage
    customerSatisfaction: number; // percentage
    repeatCustomers: number; // percentage
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    features: string[];
    expiresAt?: string;
  };
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface DealerLead {
  id: string;
  dealerId: string;
  customerId: string;
  carId: string;
  type: 'inquiry' | 'test_drive' | 'financing' | 'trade_in' | 'general';
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'closed' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'app' | 'website' | 'referral' | 'phone' | 'walk_in';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    preferredContactMethod: 'email' | 'phone' | 'sms';
    bestTimeToContact: string;
  };
  inquiry: {
    message: string;
    interestedFeatures: string[];
    budgetRange?: { min: number; max: number };
    timeframe: 'immediate' | 'week' | 'month' | 'quarter' | 'exploring';
    tradeInInfo?: {
      make: string;
      model: string;
      year: number;
      mileage: number;
      condition: string;
    };
    financingNeeded: boolean;
    creditScore?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  };
  dealerResponse?: {
    respondedAt: string;
    responseTime: number; // minutes
    message: string;
    offeredPrice?: number;
    offeredFinancing?: {
      monthlyPayment: number;
      interestRate: number;
      termMonths: number;
      downPayment: number;
    };
    nextSteps: string[];
  };
  activities: Array<{
    id: string;
    type: 'call' | 'email' | 'sms' | 'meeting' | 'note';
    timestamp: string;
    description: string;
    outcome?: string;
    followUpRequired: boolean;
    followUpDate?: string;
  }>;
  tags: string[];
  assignedTo?: string;
  estimatedValue: number;
  probability: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface DealerReview {
  id: string;
  dealerId: string;
  customerId: string;
  carId?: string;
  leadId?: string;
  type: 'purchase' | 'service' | 'inquiry';
  rating: {
    overall: number;
    communication: number;
    pricing: number;
    service: number;
    reliability: number;
  };
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  photos: string[];
  verified: boolean;
  helpful: number;
  unhelpful: number;
  dealerResponse?: {
    message: string;
    respondedAt: string;
  };
  tags: string[];
  status: 'published' | 'pending' | 'flagged' | 'removed';
  createdAt: string;
  updatedAt: string;
}

export interface DealerAnalytics {
  dealerId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    views: number;
    inquiries: number;
    leads: number;
    conversions: number;
    revenue: number;
    averageDealValue: number;
    customerSatisfaction: number;
    responseTime: number;
    marketShare: number;
  };
  trends: {
    viewsChange: number;
    inquiriesChange: number;
    leadsChange: number;
    conversionsChange: number;
    revenueChange: number;
  };
  topPerformingCars: Array<{
    carId: string;
    make: string;
    model: string;
    views: number;
    inquiries: number;
    conversions: number;
  }>;
  leadSources: Record<string, number>;
  customerDemographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    budgetRanges: Record<string, number>;
  };
  recommendations: string[];
  timestamp: string;
}

class DealerIntegrationService {
  private static instance: DealerIntegrationService;
  private dealers: Map<string, DealerProfile> = new Map();
  private leads: Map<string, DealerLead> = new Map();
  private reviews: Map<string, DealerReview> = new Map();
  private analytics: Map<string, DealerAnalytics> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DealerIntegrationService {
    if (!DealerIntegrationService.instance) {
      DealerIntegrationService.instance = new DealerIntegrationService();
    }
    return DealerIntegrationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        this.loadDealers(),
        this.loadLeads(),
        this.loadReviews(),
        this.loadAnalytics(),
      ]);

      // Initialize with sample dealers
      await this.initializeSampleDealers();

      this.isInitialized = true;
      console.log('DealerIntegrationService initialized');
    } catch (error) {
      console.error('Failed to initialize DealerIntegrationService:', error);
    }
  }

  // Dealer Profile Management
  public async createDealerProfile(profileData: Omit<DealerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerProfile> {
    const profile: DealerProfile = {
      ...profileData,
      id: `dealer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.dealers.set(profile.id, profile);
    await this.saveDealers();
    
    return profile;
  }

  public async updateDealerProfile(dealerId: string, updates: Partial<DealerProfile>): Promise<DealerProfile | null> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return null;

    const updatedDealer: DealerProfile = {
      ...dealer,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.dealers.set(dealerId, updatedDealer);
    await this.saveDealers();
    
    return updatedDealer;
  }

  public async getDealerProfile(dealerId: string): Promise<DealerProfile | null> {
    return this.dealers.get(dealerId) || null;
  }

  public async getDealersByLocation(city: string, state: string, radius: number = 50): Promise<DealerProfile[]> {
    // In a real app, this would use geolocation and database queries
    return Array.from(this.dealers.values()).filter(dealer => 
      dealer.contactInfo.address.city.toLowerCase().includes(city.toLowerCase()) ||
      dealer.contactInfo.address.state.toLowerCase().includes(state.toLowerCase())
    );
  }

  public async searchDealers(query: string, filters?: {
    verificationLevel?: string;
    specialties?: string[];
    services?: string[];
    rating?: number;
  }): Promise<DealerProfile[]> {
    let results = Array.from(this.dealers.values());

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(dealer => 
        dealer.name.toLowerCase().includes(lowerQuery) ||
        dealer.businessName.toLowerCase().includes(lowerQuery) ||
        dealer.specialties.some(specialty => specialty.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.verificationLevel) {
        results = results.filter(dealer => dealer.verificationLevel === filters.verificationLevel);
      }
      
      if (filters.specialties?.length) {
        results = results.filter(dealer => 
          filters.specialties!.some(specialty => dealer.specialties.includes(specialty))
        );
      }

      if (filters.services?.length) {
        results = results.filter(dealer => 
          filters.services!.every(service => dealer.services[service as keyof typeof dealer.services])
        );
      }

      if (filters.rating) {
        results = results.filter(dealer => dealer.rating.overall >= filters.rating!);
      }
    }

    // Sort by rating and verification level
    return results.sort((a, b) => {
      const scoreA = a.rating.overall + (a.verificationLevel === 'elite' ? 1 : a.verificationLevel === 'premium' ? 0.5 : 0);
      const scoreB = b.rating.overall + (b.verificationLevel === 'elite' ? 1 : b.verificationLevel === 'premium' ? 0.5 : 0);
      return scoreB - scoreA;
    });
  }

  public async verifyDealer(dealerId: string, verificationLevel: DealerProfile['verificationLevel']): Promise<boolean> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return false;

    dealer.verified = true;
    dealer.verificationLevel = verificationLevel;
    dealer.updatedAt = new Date().toISOString();

    // Add verification badge
    if (!dealer.badges.includes('verified')) {
      dealer.badges.push('verified');
    }

    if (verificationLevel === 'elite' && !dealer.badges.includes('elite_dealer')) {
      dealer.badges.push('elite_dealer');
    }

    this.dealers.set(dealerId, dealer);
    await this.saveDealers();
    
    return true;
  }

  // Lead Management
  public async createLead(leadData: Omit<DealerLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerLead> {
    const lead: DealerLead = {
      ...leadData,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.leads.set(lead.id, lead);
    await this.saveLeads();
    
    // Notify dealer of new lead
    await this.notifyDealerNewLead(lead);
    
    return lead;
  }

  public async updateLeadStatus(leadId: string, status: DealerLead['status'], notes?: string): Promise<DealerLead | null> {
    const lead = this.leads.get(leadId);
    if (!lead) return null;

    lead.status = status;
    lead.updatedAt = new Date().toISOString();

    if (notes) {
      lead.activities.push({
        id: `activity_${Date.now()}`,
        type: 'note',
        timestamp: new Date().toISOString(),
        description: notes,
        followUpRequired: false,
      });
    }

    this.leads.set(leadId, lead);
    await this.saveLeads();
    
    return lead;
  }

  public async addLeadActivity(leadId: string, activity: Omit<DealerLead['activities'][0], 'id'>): Promise<boolean> {
    const lead = this.leads.get(leadId);
    if (!lead) return false;

    const newActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    lead.activities.push(newActivity);
    lead.updatedAt = new Date().toISOString();

    this.leads.set(leadId, lead);
    await this.saveLeads();
    
    return true;
  }

  public async getDealerLeads(dealerId: string, filters?: {
    status?: DealerLead['status'];
    type?: DealerLead['type'];
    priority?: DealerLead['priority'];
    dateRange?: { start: string; end: string };
  }): Promise<DealerLead[]> {
    let leads = Array.from(this.leads.values()).filter(lead => lead.dealerId === dealerId);

    if (filters) {
      if (filters.status) {
        leads = leads.filter(lead => lead.status === filters.status);
      }
      
      if (filters.type) {
        leads = leads.filter(lead => lead.type === filters.type);
      }
      
      if (filters.priority) {
        leads = leads.filter(lead => lead.priority === filters.priority);
      }
      
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        leads = leads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate >= start && leadDate <= end;
        });
      }
    }

    return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async respondToLead(leadId: string, response: DealerLead['dealerResponse']): Promise<boolean> {
    const lead = this.leads.get(leadId);
    if (!lead || !response) return false;

    lead.dealerResponse = {
      ...response,
      respondedAt: new Date().toISOString(),
      responseTime: Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60)), // minutes
    };

    lead.status = 'contacted';
    lead.updatedAt = new Date().toISOString();

    this.leads.set(leadId, lead);
    await this.saveLeads();
    
    // Update dealer response time analytics
    if (lead.dealerResponse) {
      await this.updateDealerResponseTime(lead.dealerId, lead.dealerResponse.responseTime);
    }
    
    return true;
  }

  // Review Management
  public async createReview(reviewData: Omit<DealerReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealerReview> {
    const review: DealerReview = {
      ...reviewData,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(review.id, review);
    await this.saveReviews();
    
    // Update dealer rating
    await this.updateDealerRating(review.dealerId);
    
    return review;
  }

  public async getDealerReviews(dealerId: string, filters?: {
    type?: DealerReview['type'];
    rating?: number;
    verified?: boolean;
    limit?: number;
  }): Promise<DealerReview[]> {
    let reviews = Array.from(this.reviews.values()).filter(review => 
      review.dealerId === dealerId && review.status === 'published'
    );

    if (filters) {
      if (filters.type) {
        reviews = reviews.filter(review => review.type === filters.type);
      }
      
      if (filters.rating) {
        reviews = reviews.filter(review => review.rating.overall >= filters.rating!);
      }
      
      if (filters.verified !== undefined) {
        reviews = reviews.filter(review => review.verified === filters.verified);
      }
    }

    reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      reviews = reviews.slice(0, filters.limit);
    }

    return reviews;
  }

  public async respondToReview(reviewId: string, response: string): Promise<boolean> {
    const review = this.reviews.get(reviewId);
    if (!review) return false;

    review.dealerResponse = {
      message: response,
      respondedAt: new Date().toISOString(),
    };

    review.updatedAt = new Date().toISOString();

    this.reviews.set(reviewId, review);
    await this.saveReviews();
    
    return true;
  }

  public async markReviewHelpful(reviewId: string, helpful: boolean): Promise<boolean> {
    const review = this.reviews.get(reviewId);
    if (!review) return false;

    if (helpful) {
      review.helpful++;
    } else {
      review.unhelpful++;
    }

    review.updatedAt = new Date().toISOString();

    this.reviews.set(reviewId, review);
    await this.saveReviews();
    
    return true;
  }

  // Business Hours and Availability
  public async updateBusinessHours(dealerId: string, businessHours: DealerProfile['businessHours']): Promise<boolean> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return false;

    dealer.businessHours = businessHours;
    dealer.updatedAt = new Date().toISOString();

    this.dealers.set(dealerId, dealer);
    await this.saveDealers();
    
    return true;
  }

  public async isDealerOpen(dealerId: string, timestamp?: string): Promise<boolean> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return false;

    const now = timestamp ? new Date(timestamp) : new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g., 'monday'
    const currentTime = now.toTimeString().slice(0, 5); // e.g., '14:30'

    const todayHours = dealer.businessHours[dayOfWeek];
    if (!todayHours?.isOpen) return false;

    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  public async getBusinessHours(dealerId: string): Promise<DealerProfile['businessHours'] | null> {
    const dealer = this.dealers.get(dealerId);
    return dealer?.businessHours || null;
  }

  // Analytics and Performance
  public async getDealerAnalytics(dealerId: string, period: DealerAnalytics['period'] = 'month'): Promise<DealerAnalytics | null> {
    const analyticsKey = `${dealerId}_${period}`;
    let analytics = this.analytics.get(analyticsKey);

    if (!analytics) {
      analytics = await this.generateDealerAnalytics(dealerId, period);
      this.analytics.set(analyticsKey, analytics);
      await this.saveAnalytics();
    }

    return analytics;
  }

  private async generateDealerAnalytics(dealerId: string, period: DealerAnalytics['period']): Promise<DealerAnalytics> {
    const dealer = this.dealers.get(dealerId);
    const dealerLeads = Array.from(this.leads.values()).filter(lead => lead.dealerId === dealerId);
    const dealerReviews = Array.from(this.reviews.values()).filter(review => review.dealerId === dealerId);

    // Calculate period dates
    const now = new Date();
    const periodStart = this.getPeriodStart(now, period);

    // Filter data by period
    const periodLeads = dealerLeads.filter(lead => new Date(lead.createdAt) >= periodStart);
    const periodReviews = dealerReviews.filter(review => new Date(review.createdAt) >= periodStart);

    // Calculate metrics
    const views = dealer?.inventory.totalCars || 0; // Mock data
    const inquiries = periodLeads.length;
    const conversions = periodLeads.filter(lead => lead.status === 'closed').length;
    const revenue = conversions * (dealer?.inventory.averagePrice || 25000);

    const analytics: DealerAnalytics = {
      dealerId,
      period,
      metrics: {
        views: views * 50, // Mock multiplier
        inquiries,
        leads: inquiries,
        conversions,
        revenue,
        averageDealValue: revenue / Math.max(conversions, 1),
        customerSatisfaction: dealer?.rating.overall || 0,
        responseTime: dealer?.performance.responseTime || 0,
        marketShare: Math.random() * 10, // Mock data
      },
      trends: {
        viewsChange: (Math.random() - 0.5) * 20,
        inquiriesChange: (Math.random() - 0.5) * 30,
        leadsChange: (Math.random() - 0.5) * 25,
        conversionsChange: (Math.random() - 0.5) * 40,
        revenueChange: (Math.random() - 0.5) * 50,
      },
      topPerformingCars: [
        { carId: '1', make: 'Toyota', model: 'Camry', views: 150, inquiries: 12, conversions: 2 },
        { carId: '2', make: 'Honda', model: 'Accord', views: 130, inquiries: 10, conversions: 1 },
        { carId: '3', make: 'Nissan', model: 'Altima', views: 120, inquiries: 8, conversions: 1 },
      ],
      leadSources: {
        app: 60,
        website: 25,
        referral: 10,
        phone: 5,
      },
      customerDemographics: {
        ageGroups: { '25-34': 35, '35-44': 30, '45-54': 20, '55+': 15 },
        locations: { 'Local': 70, 'Regional': 20, 'National': 10 },
        budgetRanges: { 'Under $20k': 25, '$20k-$40k': 45, '$40k-$60k': 20, 'Over $60k': 10 },
      },
      recommendations: [
        'Improve response time to under 2 hours',
        'Focus on Toyota and Honda inventory',
        'Increase online presence for better visibility',
      ],
      timestamp: new Date().toISOString(),
    };

    return analytics;
  }

  private getPeriodStart(now: Date, period: DealerAnalytics['period']): Date {
    const periodStart = new Date(now);
    
    switch (period) {
      case 'day':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return periodStart;
  }

  // Utility Methods
  private async updateDealerRating(dealerId: string): Promise<void> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return;

    const reviews = Array.from(this.reviews.values()).filter(review => 
      review.dealerId === dealerId && review.status === 'published'
    );

    if (reviews.length === 0) return;

    const avgRating = {
      overall: reviews.reduce((sum, review) => sum + review.rating.overall, 0) / reviews.length,
      communication: reviews.reduce((sum, review) => sum + review.rating.communication, 0) / reviews.length,
      pricing: reviews.reduce((sum, review) => sum + review.rating.pricing, 0) / reviews.length,
      service: reviews.reduce((sum, review) => sum + review.rating.service, 0) / reviews.length,
      reliability: reviews.reduce((sum, review) => sum + review.rating.reliability, 0) / reviews.length,
      totalReviews: reviews.length,
    };

    dealer.rating = avgRating;
    dealer.updatedAt = new Date().toISOString();

    this.dealers.set(dealerId, dealer);
    await this.saveDealers();
  }

  private async updateDealerResponseTime(dealerId: string, responseTime: number): Promise<void> {
    const dealer = this.dealers.get(dealerId);
    if (!dealer) return;

    // Update running average
    const currentResponseTime = dealer.performance.responseTime;
    const newResponseTime = (currentResponseTime + responseTime) / 2;

    dealer.performance.responseTime = newResponseTime;
    dealer.updatedAt = new Date().toISOString();

    this.dealers.set(dealerId, dealer);
    await this.saveDealers();
  }

  private async notifyDealerNewLead(lead: DealerLead): Promise<void> {
    // In a real app, this would send push notifications, emails, etc.
    console.log(`New lead notification sent to dealer ${lead.dealerId} for lead ${lead.id}`);
  }

  // Sample Data Initialization
  private async initializeSampleDealers(): Promise<void> {
    if (this.dealers.size > 0) return;

    const sampleDealers: Omit<DealerProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'John Smith',
        businessName: 'Premier Auto Sales',
        licenseNumber: 'DLR-12345',
        verified: true,
        verificationLevel: 'elite',
        contactInfo: {
          phone: '(555) 123-4567',
          email: 'john@premierautosales.com',
          website: 'https://premierautosales.com',
          address: {
            street: '123 Main Street',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            coordinates: { latitude: 34.0522, longitude: -118.2437 },
          },
        },
        businessHours: {
          monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
          sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' },
        },
        specialties: ['Luxury Cars', 'Electric Vehicles', 'Certified Pre-Owned'],
        certifications: ['ASE Certified', 'Tesla Authorized', 'BMW Certified'],
        languages: ['English', 'Spanish'],
        description: 'Premier luxury car dealership with over 20 years of experience.',
        yearEstablished: 2003,
        teamSize: 15,
        serviceAreas: ['Los Angeles', 'Beverly Hills', 'Santa Monica'],
        paymentMethods: ['Cash', 'Financing', 'Lease', 'Trade-in'],
        financingOptions: ['0% APR', 'Extended Warranty', 'Gap Insurance'],
        warranties: ['3-year comprehensive', '5-year powertrain'],
        services: {
          sales: true,
          financing: true,
          tradein: true,
          inspection: true,
          delivery: true,
          warranty: true,
          maintenance: true,
        },
        rating: {
          overall: 4.8,
          communication: 4.9,
          pricing: 4.7,
          service: 4.8,
          reliability: 4.9,
          totalReviews: 127,
        },
        badges: ['verified', 'elite_dealer', 'top_rated', 'quick_responder'],
        socialMedia: {
          facebook: 'https://facebook.com/premierautosales',
          instagram: 'https://instagram.com/premierautosales',
        },
        inventory: {
          totalCars: 85,
          averagePrice: 45000,
          priceRange: { min: 15000, max: 150000 },
          popularMakes: ['BMW', 'Mercedes-Benz', 'Audi', 'Tesla'],
        },
        performance: {
          responseTime: 1.2,
          viewToLeadConversion: 12.5,
          customerSatisfaction: 96,
          repeatCustomers: 35,
        },
        subscription: {
          plan: 'premium',
          features: ['Priority listing', 'Analytics dashboard', 'Lead management'],
        },
        status: 'active',
      },
      {
        name: 'Sarah Johnson',
        businessName: 'Family First Motors',
        licenseNumber: 'DLR-67890',
        verified: true,
        verificationLevel: 'premium',
        contactInfo: {
          phone: '(555) 987-6543',
          email: 'sarah@familyfirstmotors.com',
          address: {
            street: '456 Oak Avenue',
            city: 'San Diego',
            state: 'CA',
            zipCode: '92101',
            coordinates: { latitude: 32.7157, longitude: -117.1611 },
          },
        },
        businessHours: {
          monday: { isOpen: true, openTime: '08:30', closeTime: '19:00' },
          tuesday: { isOpen: true, openTime: '08:30', closeTime: '19:00' },
          wednesday: { isOpen: true, openTime: '08:30', closeTime: '19:00' },
          thursday: { isOpen: true, openTime: '08:30', closeTime: '19:00' },
          friday: { isOpen: true, openTime: '08:30', closeTime: '19:00' },
          saturday: { isOpen: true, openTime: '08:30', closeTime: '18:00' },
          sunday: { isOpen: true, openTime: '10:00', closeTime: '17:00' },
        },
        specialties: ['Family Vehicles', 'SUVs', 'Minivans', 'Safety First'],
        certifications: ['NADA Certified', 'Safety Inspector'],
        languages: ['English'],
        description: 'Trusted family-owned dealership specializing in safe, reliable vehicles.',
        yearEstablished: 1995,
        teamSize: 8,
        serviceAreas: ['San Diego', 'Chula Vista', 'El Cajon'],
        paymentMethods: ['Cash', 'Financing', 'Trade-in'],
        financingOptions: ['Low APR', 'Extended Warranty'],
        warranties: ['2-year comprehensive'],
        services: {
          sales: true,
          financing: true,
          tradein: true,
          inspection: true,
          delivery: false,
          warranty: true,
          maintenance: false,
        },
        rating: {
          overall: 4.6,
          communication: 4.7,
          pricing: 4.8,
          service: 4.5,
          reliability: 4.6,
          totalReviews: 89,
        },
        badges: ['verified', 'family_friendly', 'honest_pricing'],
        socialMedia: {},
        inventory: {
          totalCars: 45,
          averagePrice: 28000,
          priceRange: { min: 12000, max: 55000 },
          popularMakes: ['Toyota', 'Honda', 'Subaru', 'Mazda'],
        },
        performance: {
          responseTime: 2.1,
          viewToLeadConversion: 8.3,
          customerSatisfaction: 92,
          repeatCustomers: 45,
        },
        subscription: {
          plan: 'basic',
          features: ['Basic listing', 'Contact management'],
        },
        status: 'active',
      },
    ];

    for (const dealerData of sampleDealers) {
      await this.createDealerProfile(dealerData);
    }
  }

  // Data Persistence
  private async loadDealers(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('dealers');
      if (data) {
        const dealers = JSON.parse(data);
        this.dealers = new Map(dealers);
      }
    } catch (error) {
      console.error('Failed to load dealers:', error);
    }
  }

  private async saveDealers(): Promise<void> {
    try {
      const dealers = Array.from(this.dealers.entries());
      await AsyncStorage.setItem('dealers', JSON.stringify(dealers));
    } catch (error) {
      console.error('Failed to save dealers:', error);
    }
  }

  private async loadLeads(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('dealer_leads');
      if (data) {
        const leads = JSON.parse(data);
        this.leads = new Map(leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  }

  private async saveLeads(): Promise<void> {
    try {
      const leads = Array.from(this.leads.entries());
      await AsyncStorage.setItem('dealer_leads', JSON.stringify(leads));
    } catch (error) {
      console.error('Failed to save leads:', error);
    }
  }

  private async loadReviews(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('dealer_reviews');
      if (data) {
        const reviews = JSON.parse(data);
        this.reviews = new Map(reviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }

  private async saveReviews(): Promise<void> {
    try {
      const reviews = Array.from(this.reviews.entries());
      await AsyncStorage.setItem('dealer_reviews', JSON.stringify(reviews));
    } catch (error) {
      console.error('Failed to save reviews:', error);
    }
  }

  private async loadAnalytics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('dealer_analytics');
      if (data) {
        const analytics = JSON.parse(data);
        this.analytics = new Map(analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  private async saveAnalytics(): Promise<void> {
    try {
      const analytics = Array.from(this.analytics.entries());
      await AsyncStorage.setItem('dealer_analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  // Public API for external access
  public async getAllDealers(): Promise<DealerProfile[]> {
    return Array.from(this.dealers.values());
  }

  public async getDealerStats(): Promise<{
    totalDealers: number;
    verifiedDealers: number;
    eliteDealers: number;
    averageRating: number;
  }> {
    const dealers = Array.from(this.dealers.values());
    
    return {
      totalDealers: dealers.length,
      verifiedDealers: dealers.filter(d => d.verified).length,
      eliteDealers: dealers.filter(d => d.verificationLevel === 'elite').length,
      averageRating: dealers.reduce((sum, d) => sum + d.rating.overall, 0) / dealers.length,
    };
  }
}

// Singleton instance
export const dealerService = DealerIntegrationService.getInstance();

// React Hook for Dealer Integration
export const useDealerService = () => {
  return {
    createLead: dealerService.createLead.bind(dealerService),
    getDealerProfile: dealerService.getDealerProfile.bind(dealerService),
    searchDealers: dealerService.searchDealers.bind(dealerService),
    getDealersByLocation: dealerService.getDealersByLocation.bind(dealerService),
    createReview: dealerService.createReview.bind(dealerService),
    getDealerReviews: dealerService.getDealerReviews.bind(dealerService),
    isDealerOpen: dealerService.isDealerOpen.bind(dealerService),
    getBusinessHours: dealerService.getBusinessHours.bind(dealerService),
    getDealerAnalytics: dealerService.getDealerAnalytics.bind(dealerService),
  };
};

export default dealerService;
