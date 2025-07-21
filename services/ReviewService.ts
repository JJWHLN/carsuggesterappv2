import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Enhanced Review System Types
export interface UserReview {
  id: string;
  userId: string;
  carId: string;
  dealerId?: string;
  type: 'car' | 'dealer' | 'service';
  category: 'purchase' | 'test_drive' | 'service' | 'inquiry' | 'general';
  rating: {
    overall: number;
    value: number;
    condition: number;
    performance: number;
    features: number;
    dealerService?: number;
    communication?: number;
    honesty?: number;
  };
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  purchasePrice?: number;
  purchaseDate?: string;
  ownership: {
    duration: number; // months
    milesDriven: number;
    maintenanceCost: number;
    issues: string[];
  };
  verification: {
    isVerified: boolean;
    verificationMethod?: 'purchase_receipt' | 'service_record' | 'vin_check' | 'dealer_confirm';
    verifiedAt?: string;
    verificationScore: number; // 0-100
  };
  media: {
    photos: Array<{
      url: string;
      caption?: string;
      timestamp: string;
    }>;
    videos: Array<{
      url: string;
      caption?: string;
      duration: number;
      timestamp: string;
    }>;
  };
  tags: string[];
  helpful: number;
  unhelpful: number;
  responses: Array<{
    id: string;
    userId: string;
    userType: 'user' | 'dealer' | 'expert' | 'moderator';
    message: string;
    timestamp: string;
    helpful: number;
    unhelpful: number;
  }>;
  flags: Array<{
    id: string;
    userId: string;
    reason: 'spam' | 'inappropriate' | 'fake' | 'outdated' | 'misleading';
    message?: string;
    timestamp: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  }>;
  moderation: {
    status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
    moderatedBy?: string;
    moderatedAt?: string;
    moderationNotes?: string;
    autoModerationScore: number; // 0-100
  };
  engagement: {
    views: number;
    shares: number;
    bookmarks: number;
    clickThroughs: number;
  };
  visibility: {
    isPublic: boolean;
    isAnonymous: boolean;
    showPurchaseInfo: boolean;
    showLocation: boolean;
  };
  location?: {
    city: string;
    state: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalReview {
  id: string;
  source: 'edmunds' | 'kbb' | 'consumer_reports' | 'motor_trend' | 'car_and_driver' | 'internal';
  expertId: string;
  expertName: string;
  expertCredentials: string[];
  carId: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  rating: {
    overall: number;
    performance: number;
    comfort: number;
    fuelEconomy: number;
    reliability: number;
    safety: number;
    technology: number;
    value: number;
  };
  summary: string;
  fullReview: string;
  highlights: string[];
  concerns: string[];
  bottomLine: string;
  awards: string[];
  testResults: {
    acceleration060: number; // seconds
    quarterMile: number; // seconds
    topSpeed: number; // mph
    fuelEconomyCity: number; // mpg
    fuelEconomyHighway: number; // mpg
    brakingDistance: number; // feet
    handlingScore: number; // 0-100
  };
  safetyRatings: {
    nhtsa?: {
      overall: number;
      frontalCrash: number;
      sideCrash: number;
      rollover: number;
    };
    iihs?: {
      topSafetyPick: boolean;
      moderateOverlap: string;
      smallOverlap: string;
      sideImpact: string;
      roofStrength: string;
      headRestraints: string;
    };
  };
  competitorComparisons: Array<{
    competitorMake: string;
    competitorModel: string;
    competitorYear: number;
    comparison: string;
    winner?: 'reviewed' | 'competitor' | 'tie';
  }>;
  mediaContent: {
    photos: string[];
    videos: string[];
    infographics: string[];
  };
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  weight: number; // for sorting/ranking
  credibilityScore: number; // 0-100
}

export interface ReviewAggregation {
  carId: string;
  totalReviews: number;
  userReviews: number;
  professionalReviews: number;
  averageRating: {
    overall: number;
    value: number;
    condition: number;
    performance: number;
    features: number;
    reliability: number;
  };
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  commonPros: Array<{
    text: string;
    count: number;
    percentage: number;
  }>;
  commonCons: Array<{
    text: string;
    count: number;
    percentage: number;
  }>;
  recommendationPercentage: number;
  verifiedReviewsPercentage: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trends: {
    ratingTrend: 'improving' | 'declining' | 'stable';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    sentimentTrend: 'improving' | 'declining' | 'stable';
  };
  insights: string[];
  lastUpdated: string;
}

export interface ReviewModeration {
  id: string;
  reviewId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'flag' | 'edit' | 'remove';
  reason?: string;
  notes?: string;
  autoModerationTriggers: string[];
  manualReviewRequired: boolean;
  escalated: boolean;
  timestamp: string;
}

export interface ReviewRecommendation {
  userId: string;
  carId: string;
  score: number; // 0-100
  reasons: string[];
  similarUsers: string[];
  basedOnReviews: string[];
  confidence: number; // 0-100
  explanation: string;
}

class ReviewSystemService {
  private static instance: ReviewSystemService;
  private userReviews: Map<string, UserReview> = new Map();
  private professionalReviews: Map<string, ProfessionalReview> = new Map();
  private aggregations: Map<string, ReviewAggregation> = new Map();
  private moderations: Map<string, ReviewModeration> = new Map();
  private recommendations: Map<string, ReviewRecommendation[]> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ReviewSystemService {
    if (!ReviewSystemService.instance) {
      ReviewSystemService.instance = new ReviewSystemService();
    }
    return ReviewSystemService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        this.loadUserReviews(),
        this.loadProfessionalReviews(),
        this.loadAggregations(),
        this.loadModerations(),
        this.loadRecommendations(),
      ]);

      // Initialize with sample data
      await this.initializeSampleReviews();

      this.isInitialized = true;
      console.log('ReviewSystemService initialized');
    } catch (error) {
      console.error('Failed to initialize ReviewSystemService:', error);
    }
  }

  // User Review Management
  public async createUserReview(reviewData: Omit<UserReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserReview> {
    const review: UserReview = {
      ...reviewData,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-moderation check
    review.moderation = await this.performAutoModeration(review);

    this.userReviews.set(review.id, review);
    await this.saveUserReviews();

    // Update aggregation
    await this.updateAggregation(review.carId);

    // Generate recommendations based on new review
    await this.generateRecommendationsFromReview(review);

    return review;
  }

  public async updateUserReview(reviewId: string, updates: Partial<UserReview>): Promise<UserReview | null> {
    const review = this.userReviews.get(reviewId);
    if (!review) return null;

    const updatedReview: UserReview = {
      ...review,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Re-run moderation if content changed
    if (updates.content || updates.title) {
      updatedReview.moderation = await this.performAutoModeration(updatedReview);
    }

    this.userReviews.set(reviewId, updatedReview);
    await this.saveUserReviews();

    // Update aggregation if rating changed
    if (updates.rating) {
      await this.updateAggregation(updatedReview.carId);
    }

    return updatedReview;
  }

  public async getUserReviews(filters?: {
    userId?: string;
    carId?: string;
    dealerId?: string;
    type?: UserReview['type'];
    verified?: boolean;
    rating?: number;
    limit?: number;
    offset?: number;
  }): Promise<UserReview[]> {
    let reviews = Array.from(this.userReviews.values()).filter(
      review => review.moderation.status === 'approved'
    );

    if (filters) {
      if (filters.userId) {
        reviews = reviews.filter(review => review.userId === filters.userId);
      }
      
      if (filters.carId) {
        reviews = reviews.filter(review => review.carId === filters.carId);
      }
      
      if (filters.dealerId) {
        reviews = reviews.filter(review => review.dealerId === filters.dealerId);
      }
      
      if (filters.type) {
        reviews = reviews.filter(review => review.type === filters.type);
      }
      
      if (filters.verified !== undefined) {
        reviews = reviews.filter(review => review.verification.isVerified === filters.verified);
      }
      
      if (filters.rating) {
        reviews = reviews.filter(review => review.rating.overall >= filters.rating!);
      }
    }

    // Sort by helpfulness and recency
    reviews = reviews.sort((a, b) => {
      const scoreA = a.helpful - a.unhelpful + (new Date(a.createdAt).getTime() / 1000000);
      const scoreB = b.helpful - b.unhelpful + (new Date(b.createdAt).getTime() / 1000000);
      return scoreB - scoreA;
    });

    if (filters?.offset) {
      reviews = reviews.slice(filters.offset);
    }

    if (filters?.limit) {
      reviews = reviews.slice(0, filters.limit);
    }

    return reviews;
  }

  public async verifyReview(reviewId: string, verificationMethod: UserReview['verification']['verificationMethod']): Promise<boolean> {
    const review = this.userReviews.get(reviewId);
    if (!review) return false;

    review.verification = {
      isVerified: true,
      verificationMethod,
      verifiedAt: new Date().toISOString(),
      verificationScore: this.calculateVerificationScore(verificationMethod),
    };

    review.updatedAt = new Date().toISOString();

    this.userReviews.set(reviewId, review);
    await this.saveUserReviews();

    return true;
  }

  // Professional Review Management
  public async addProfessionalReview(reviewData: Omit<ProfessionalReview, 'id'>): Promise<ProfessionalReview> {
    const review: ProfessionalReview = {
      ...reviewData,
      id: `prof_review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.professionalReviews.set(review.id, review);
    await this.saveProfessionalReviews();

    // Update aggregation
    await this.updateAggregation(review.carId);

    return review;
  }

  public async getProfessionalReviews(carId: string): Promise<ProfessionalReview[]> {
    return Array.from(this.professionalReviews.values())
      .filter(review => review.carId === carId)
      .sort((a, b) => b.credibilityScore - a.credibilityScore);
  }

  // Review Aggregation
  public async getReviewAggregation(carId: string): Promise<ReviewAggregation | null> {
    let aggregation = this.aggregations.get(carId);
    
    if (!aggregation) {
      aggregation = await this.calculateAggregation(carId);
      this.aggregations.set(carId, aggregation);
      await this.saveAggregations();
    }

    return aggregation;
  }

  private async calculateAggregation(carId: string): Promise<ReviewAggregation> {
    const userReviews = Array.from(this.userReviews.values()).filter(
      review => review.carId === carId && review.moderation.status === 'approved'
    );
    const professionalReviews = Array.from(this.professionalReviews.values()).filter(
      review => review.carId === carId
    );

    const totalReviews = userReviews.length + professionalReviews.length;

    // Calculate average ratings
    const userRatingSum = userReviews.reduce((sum, review) => ({
      overall: sum.overall + review.rating.overall,
      value: sum.value + review.rating.value,
      condition: sum.condition + review.rating.condition,
      performance: sum.performance + review.rating.performance,
      features: sum.features + review.rating.features,
    }), { overall: 0, value: 0, condition: 0, performance: 0, features: 0 });

    const professionalRatingSum = professionalReviews.reduce((sum, review) => ({
      overall: sum.overall + review.rating.overall,
      performance: sum.performance + review.rating.performance,
      reliability: sum.reliability + review.rating.reliability,
    }), { overall: 0, performance: 0, reliability: 0 });

    const averageRating = {
      overall: totalReviews > 0 ? 
        (userRatingSum.overall + professionalRatingSum.overall) / totalReviews : 0,
      value: userReviews.length > 0 ? userRatingSum.value / userReviews.length : 0,
      condition: userReviews.length > 0 ? userRatingSum.condition / userReviews.length : 0,
      performance: totalReviews > 0 ? 
        (userRatingSum.performance + professionalRatingSum.performance) / totalReviews : 0,
      features: userReviews.length > 0 ? userRatingSum.features / userReviews.length : 0,
      reliability: professionalReviews.length > 0 ? 
        professionalRatingSum.reliability / professionalReviews.length : 0,
    };

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    [...userReviews, ...professionalReviews].forEach(review => {
      const rating = Math.round(review.rating.overall);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      }
    });

    // Analyze pros and cons
    const prosMap = new Map<string, number>();
    const consMap = new Map<string, number>();

    userReviews.forEach(review => {
      review.pros.forEach(pro => {
        prosMap.set(pro.toLowerCase(), (prosMap.get(pro.toLowerCase()) || 0) + 1);
      });
      review.cons.forEach(con => {
        consMap.set(con.toLowerCase(), (consMap.get(con.toLowerCase()) || 0) + 1);
      });
    });

    const commonPros = Array.from(prosMap.entries())
      .map(([text, count]) => ({
        text,
        count,
        percentage: (count / userReviews.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const commonCons = Array.from(consMap.entries())
      .map(([text, count]) => ({
        text,
        count,
        percentage: (count / userReviews.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate recommendation percentage
    const recommendationPercentage = userReviews.length > 0 ?
      (userReviews.filter(review => review.wouldRecommend).length / userReviews.length) * 100 : 0;

    // Calculate verified reviews percentage
    const verifiedReviewsPercentage = userReviews.length > 0 ?
      (userReviews.filter(review => review.verification.isVerified).length / userReviews.length) * 100 : 0;

    // Sentiment analysis (simplified)
    const sentiment = this.analyzeSentiment(userReviews);

    // Generate insights
    const insights = this.generateInsights(userReviews, professionalReviews, averageRating);

    const aggregation: ReviewAggregation = {
      carId,
      totalReviews,
      userReviews: userReviews.length,
      professionalReviews: professionalReviews.length,
      averageRating,
      ratingDistribution,
      commonPros,
      commonCons,
      recommendationPercentage,
      verifiedReviewsPercentage,
      sentiment,
      trends: {
        ratingTrend: 'stable', // Would be calculated from historical data
        volumeTrend: 'stable',
        sentimentTrend: 'stable',
      },
      insights,
      lastUpdated: new Date().toISOString(),
    };

    return aggregation;
  }

  private async updateAggregation(carId: string): Promise<void> {
    const aggregation = await this.calculateAggregation(carId);
    this.aggregations.set(carId, aggregation);
    await this.saveAggregations();
  }

  // Review Interactions
  public async markReviewHelpful(reviewId: string, userId: string, helpful: boolean): Promise<boolean> {
    const review = this.userReviews.get(reviewId);
    if (!review) return false;

    // In a real app, would track user votes to prevent duplicate voting
    if (helpful) {
      review.helpful++;
    } else {
      review.unhelpful++;
    }

    review.updatedAt = new Date().toISOString();

    this.userReviews.set(reviewId, review);
    await this.saveUserReviews();

    return true;
  }

  public async addReviewResponse(reviewId: string, response: Omit<UserReview['responses'][0], 'id'>): Promise<boolean> {
    const review = this.userReviews.get(reviewId);
    if (!review) return false;

    const newResponse = {
      ...response,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    review.responses.push(newResponse);
    review.updatedAt = new Date().toISOString();

    this.userReviews.set(reviewId, review);
    await this.saveUserReviews();

    return true;
  }

  public async flagReview(reviewId: string, flag: Omit<UserReview['flags'][0], 'id'>): Promise<boolean> {
    const review = this.userReviews.get(reviewId);
    if (!review) return false;

    const newFlag = {
      ...flag,
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    review.flags.push(newFlag);
    review.updatedAt = new Date().toISOString();

    // If multiple flags, mark for manual review
    if (review.flags.length >= 3) {
      review.moderation.status = 'flagged';
    }

    this.userReviews.set(reviewId, review);
    await this.saveUserReviews();

    return true;
  }

  // Moderation System
  private async performAutoModeration(review: UserReview): Promise<UserReview['moderation']> {
    let score = 100;
    const reasons: string[] = [];

    // Check for spam indicators
    if (this.containsSpamKeywords(review.content)) {
      score -= 30;
      reasons.push('potential_spam');
    }

    // Check for inappropriate content
    if (this.containsInappropriateContent(review.content)) {
      score -= 40;
      reasons.push('inappropriate_content');
    }

    // Check for fake review indicators
    if (this.detectFakeReviewPatterns(review)) {
      score -= 25;
      reasons.push('fake_review_patterns');
    }

    // Check for extremely positive/negative bias
    if (this.detectExtremeBias(review)) {
      score -= 15;
      reasons.push('extreme_bias');
    }

    const status = score >= 80 ? 'approved' : 
                  score >= 60 ? 'pending' : 
                  score >= 40 ? 'flagged' : 'rejected';

    return {
      status,
      autoModerationScore: score,
      moderatedAt: new Date().toISOString(),
      moderationNotes: reasons.join(', '),
    };
  }

  private containsSpamKeywords(content: string): boolean {
    const spamKeywords = ['buy now', 'click here', 'guaranteed', 'free money', 'act now'];
    const lowerContent = content.toLowerCase();
    return spamKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private containsInappropriateContent(content: string): boolean {
    // Simplified inappropriate content detection
    const inappropriateKeywords = ['hate', 'discrimination', 'violence'];
    const lowerContent = content.toLowerCase();
    return inappropriateKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private detectFakeReviewPatterns(review: UserReview): boolean {
    // Simplified fake review detection
    return review.content.length < 20 || 
           review.rating.overall === 5 && review.cons.length === 0 ||
           review.rating.overall === 1 && review.pros.length === 0;
  }

  private detectExtremeBias(review: UserReview): boolean {
    const ratings = Object.values(review.rating);
    const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - avg, 2), 0) / ratings.length;
    return variance < 0.1; // All ratings too similar
  }

  // Recommendation System
  public async getReviewBasedRecommendations(userId: string, carId: string): Promise<ReviewRecommendation | null> {
    const userKey = `${userId}_${carId}`;
    const recommendations = this.recommendations.get(userKey);
    
    if (!recommendations || recommendations.length === 0) {
      return null;
    }

    return recommendations[0]; // Return top recommendation
  }

  private async generateRecommendationsFromReview(review: UserReview): Promise<void> {
    // Simplified recommendation generation based on review patterns
    const similarReviews = Array.from(this.userReviews.values()).filter(r => 
      r.carId !== review.carId && 
      Math.abs(r.rating.overall - review.rating.overall) <= 1 &&
      r.pros.some(pro => review.pros.includes(pro))
    );

    const recommendation: ReviewRecommendation = {
      userId: review.userId,
      carId: review.carId,
      score: 85,
      reasons: ['Similar user preferences', 'Positive reviews for similar features'],
      similarUsers: similarReviews.slice(0, 3).map(r => r.userId),
      basedOnReviews: similarReviews.slice(0, 5).map(r => r.id),
      confidence: 78,
      explanation: 'Based on your review patterns and similar user experiences',
    };

    const userKey = review.userId;
    const existingRecommendations = this.recommendations.get(userKey) || [];
    existingRecommendations.push(recommendation);
    
    this.recommendations.set(userKey, existingRecommendations);
    await this.saveRecommendations();
  }

  // Analytics and Insights
  private analyzeSentiment(reviews: UserReview[]): ReviewAggregation['sentiment'] {
    if (reviews.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    reviews.forEach(review => {
      const avgRating = review.rating.overall;
      if (avgRating >= 4) positive++;
      else if (avgRating <= 2) negative++;
      else neutral++;
    });

    const total = reviews.length;
    return {
      positive: (positive / total) * 100,
      neutral: (neutral / total) * 100,
      negative: (negative / total) * 100,
    };
  }

  private generateInsights(userReviews: UserReview[], professionalReviews: ProfessionalReview[], averageRating: ReviewAggregation['averageRating']): string[] {
    const insights: string[] = [];

    // Rating insights
    if (averageRating.overall >= 4.5) {
      insights.push('Highly rated vehicle with excellent user satisfaction');
    } else if (averageRating.overall <= 2.5) {
      insights.push('Below average ratings indicate potential concerns');
    }

    // Professional vs user rating comparison
    const professionalAvg = professionalReviews.length > 0 ? 
      professionalReviews.reduce((sum, r) => sum + r.rating.overall, 0) / professionalReviews.length : 0;
    
    if (Math.abs(averageRating.overall - professionalAvg) > 1) {
      insights.push('User and professional opinions differ significantly');
    }

    // Review volume insights
    if (userReviews.length < 5) {
      insights.push('Limited user reviews available - consider waiting for more feedback');
    }

    // Verification insights
    const verifiedCount = userReviews.filter(r => r.verification.isVerified).length;
    if (verifiedCount / userReviews.length > 0.7) {
      insights.push('High percentage of verified reviews increases reliability');
    }

    return insights;
  }

  private calculateVerificationScore(method?: UserReview['verification']['verificationMethod']): number {
    switch (method) {
      case 'purchase_receipt': return 95;
      case 'service_record': return 85;
      case 'vin_check': return 80;
      case 'dealer_confirm': return 75;
      default: return 50;
    }
  }

  // Sample Data Initialization
  private async initializeSampleReviews(): Promise<void> {
    if (this.userReviews.size > 0) return;

    const sampleUserReviews: Omit<UserReview, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        userId: 'user1',
        carId: '1',
        dealerId: 'dealer1',
        type: 'car',
        category: 'purchase',
        rating: {
          overall: 5,
          value: 4,
          condition: 5,
          performance: 5,
          features: 4,
          dealerService: 5,
          communication: 5,
          honesty: 5,
        },
        title: 'Excellent Toyota Camry - Highly Recommended',
        content: 'I purchased this 2023 Toyota Camry and have been extremely satisfied. The car runs smoothly, has great fuel economy, and the dealer was very professional throughout the process.',
        pros: ['Great fuel economy', 'Smooth ride', 'Professional dealer', 'Reliable'],
        cons: ['Interior could be more premium'],
        wouldRecommend: true,
        purchasePrice: 28500,
        purchaseDate: '2024-01-15',
        ownership: {
          duration: 6,
          milesDriven: 8500,
          maintenanceCost: 150,
          issues: [],
        },
        verification: {
          isVerified: true,
          verificationMethod: 'purchase_receipt',
          verifiedAt: '2024-01-20T10:00:00Z',
          verificationScore: 95,
        },
        media: {
          photos: [
            {
              url: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg',
              caption: 'Exterior view',
              timestamp: '2024-01-15T14:00:00Z',
            },
          ],
          videos: [],
        },
        tags: ['reliable', 'fuel-efficient', 'family-car'],
        helpful: 12,
        unhelpful: 1,
        responses: [],
        flags: [],
        moderation: {
          status: 'approved',
          autoModerationScore: 98,
          moderatedAt: '2024-01-15T12:00:00Z',
        },
        engagement: {
          views: 45,
          shares: 3,
          bookmarks: 8,
          clickThroughs: 15,
        },
        visibility: {
          isPublic: true,
          isAnonymous: false,
          showPurchaseInfo: true,
          showLocation: true,
        },
        location: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
        },
      },
    ];

    const sampleProfessionalReviews: Omit<ProfessionalReview, 'id'>[] = [
      {
        source: 'edmunds',
        expertId: 'expert1',
        expertName: 'John AutoExpert',
        expertCredentials: ['ASE Certified', '20 Years Experience'],
        carId: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        trim: 'LE',
        rating: {
          overall: 4.5,
          performance: 4.0,
          comfort: 4.5,
          fuelEconomy: 5.0,
          reliability: 5.0,
          safety: 4.5,
          technology: 4.0,
          value: 4.5,
        },
        summary: 'The 2023 Toyota Camry continues to be a solid midsize sedan choice with excellent reliability and fuel economy.',
        fullReview: 'The Toyota Camry has long been a staple in the midsize sedan segment, and the 2023 model year continues that tradition with refinements and improvements...',
        highlights: ['Outstanding fuel economy', 'Proven reliability', 'Spacious interior', 'Strong safety ratings'],
        concerns: ['CVT transmission feel', 'Road noise at highway speeds'],
        bottomLine: 'A safe, reliable choice for families seeking a practical midsize sedan.',
        awards: ['IIHS Top Safety Pick', 'Best Midsize Sedan for Families'],
        testResults: {
          acceleration060: 8.2,
          quarterMile: 16.1,
          topSpeed: 125,
          fuelEconomyCity: 32,
          fuelEconomyHighway: 41,
          brakingDistance: 125,
          handlingScore: 78,
        },
        safetyRatings: {
          nhtsa: {
            overall: 5,
            frontalCrash: 5,
            sideCrash: 5,
            rollover: 4,
          },
          iihs: {
            topSafetyPick: true,
            moderateOverlap: 'Good',
            smallOverlap: 'Good',
            sideImpact: 'Good',
            roofStrength: 'Good',
            headRestraints: 'Good',
          },
        },
        competitorComparisons: [
          {
            competitorMake: 'Honda',
            competitorModel: 'Accord',
            competitorYear: 2023,
            comparison: 'Both are excellent choices, but the Camry edges out with better reliability scores',
            winner: 'reviewed',
          },
        ],
        mediaContent: {
          photos: ['https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg'],
          videos: [],
          infographics: [],
        },
        tags: ['midsize', 'sedan', 'reliable', 'fuel-efficient'],
        publishedAt: '2023-09-15T10:00:00Z',
        updatedAt: '2023-09-15T10:00:00Z',
        weight: 90,
        credibilityScore: 95,
      },
    ];

    // Create sample reviews
    for (const reviewData of sampleUserReviews) {
      await this.createUserReview(reviewData);
    }

    for (const reviewData of sampleProfessionalReviews) {
      await this.addProfessionalReview(reviewData);
    }
  }

  // Data Persistence
  private async loadUserReviews(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('user_reviews');
      if (data) {
        const reviews = JSON.parse(data);
        this.userReviews = new Map(reviews);
      }
    } catch (error) {
      console.error('Failed to load user reviews:', error);
    }
  }

  private async saveUserReviews(): Promise<void> {
    try {
      const reviews = Array.from(this.userReviews.entries());
      await AsyncStorage.setItem('user_reviews', JSON.stringify(reviews));
    } catch (error) {
      console.error('Failed to save user reviews:', error);
    }
  }

  private async loadProfessionalReviews(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('professional_reviews');
      if (data) {
        const reviews = JSON.parse(data);
        this.professionalReviews = new Map(reviews);
      }
    } catch (error) {
      console.error('Failed to load professional reviews:', error);
    }
  }

  private async saveProfessionalReviews(): Promise<void> {
    try {
      const reviews = Array.from(this.professionalReviews.entries());
      await AsyncStorage.setItem('professional_reviews', JSON.stringify(reviews));
    } catch (error) {
      console.error('Failed to save professional reviews:', error);
    }
  }

  private async loadAggregations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('review_aggregations');
      if (data) {
        const aggregations = JSON.parse(data);
        this.aggregations = new Map(aggregations);
      }
    } catch (error) {
      console.error('Failed to load aggregations:', error);
    }
  }

  private async saveAggregations(): Promise<void> {
    try {
      const aggregations = Array.from(this.aggregations.entries());
      await AsyncStorage.setItem('review_aggregations', JSON.stringify(aggregations));
    } catch (error) {
      console.error('Failed to save aggregations:', error);
    }
  }

  private async loadModerations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('review_moderations');
      if (data) {
        const moderations = JSON.parse(data);
        this.moderations = new Map(moderations);
      }
    } catch (error) {
      console.error('Failed to load moderations:', error);
    }
  }

  private async saveModerations(): Promise<void> {
    try {
      const moderations = Array.from(this.moderations.entries());
      await AsyncStorage.setItem('review_moderations', JSON.stringify(moderations));
    } catch (error) {
      console.error('Failed to save moderations:', error);
    }
  }

  private async loadRecommendations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('review_recommendations');
      if (data) {
        const recommendations = JSON.parse(data);
        this.recommendations = new Map(recommendations);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    try {
      const recommendations = Array.from(this.recommendations.entries());
      await AsyncStorage.setItem('review_recommendations', JSON.stringify(recommendations));
    } catch (error) {
      console.error('Failed to save recommendations:', error);
    }
  }

  // Public API
  public async getReviewStats(): Promise<{
    totalUserReviews: number;
    totalProfessionalReviews: number;
    averageRating: number;
    verifiedPercentage: number;
  }> {
    const userReviews = Array.from(this.userReviews.values());
    const professionalReviews = Array.from(this.professionalReviews.values());
    const verifiedReviews = userReviews.filter(r => r.verification.isVerified);

    return {
      totalUserReviews: userReviews.length,
      totalProfessionalReviews: professionalReviews.length,
      averageRating: userReviews.length > 0 ? 
        userReviews.reduce((sum, r) => sum + r.rating.overall, 0) / userReviews.length : 0,
      verifiedPercentage: userReviews.length > 0 ? 
        (verifiedReviews.length / userReviews.length) * 100 : 0,
    };
  }
}

// Singleton instance
export const reviewSystem = ReviewSystemService.getInstance();

// React Hook for Review System
export const useReviewSystem = () => {
  return {
    createUserReview: reviewSystem.createUserReview.bind(reviewSystem),
    getUserReviews: reviewSystem.getUserReviews.bind(reviewSystem),
    getProfessionalReviews: reviewSystem.getProfessionalReviews.bind(reviewSystem),
    getReviewAggregation: reviewSystem.getReviewAggregation.bind(reviewSystem),
    markReviewHelpful: reviewSystem.markReviewHelpful.bind(reviewSystem),
    addReviewResponse: reviewSystem.addReviewResponse.bind(reviewSystem),
    flagReview: reviewSystem.flagReview.bind(reviewSystem),
    verifyReview: reviewSystem.verifyReview.bind(reviewSystem),
    getReviewBasedRecommendations: reviewSystem.getReviewBasedRecommendations.bind(reviewSystem),
    getReviewStats: reviewSystem.getReviewStats.bind(reviewSystem),
  };
};

export default reviewSystem;
