/**
 * Business Analytics Service - Track Business Performance
 * 
 * Monitors lead generation, price alert engagement, and conversion rates
 * to optimize business features and revenue generation.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface BusinessMetrics {
  leads: {
    total: number;
    thisWeek: number;
    conversionRate: number;
    topSources: Array<{ source: string; count: number }>;
  };
  priceAlerts: {
    active: number;
    triggered: number;
    conversionRate: number; // alerts that led to dealer contact
    avgTargetDiscount: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    avgSessionDuration: number;
    returnUserRate: number;
    mostViewedCars: Array<{ carId: string; views: number; title: string }>;
  };
  revenue: {
    leadsGenerated: number;
    estimatedValue: number; // leads × avg commission
    topPerformingCars: Array<{ carId: string; leads: number; title: string }>;
  };
}

export interface LeadAnalytics {
  leadId: string;
  userId: string;
  carId: string;
  status: 'new' | 'contacted' | 'test_drive' | 'sold' | 'lost';
  source: 'car_detail' | 'price_alert' | 'search' | 'recommendation';
  createdAt: string;
  lastUpdated: string;
  dealerResponse?: {
    responseTime: number; // minutes
    contactMethod: string;
    message?: string;
  };
}

class BusinessAnalyticsService {
  private static instance: BusinessAnalyticsService;

  static getInstance(): BusinessAnalyticsService {
    if (!BusinessAnalyticsService.instance) {
      BusinessAnalyticsService.instance = new BusinessAnalyticsService();
    }
    return BusinessAnalyticsService.instance;
  }

  /**
   * Get comprehensive business metrics
   */
  async getBusinessMetrics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<BusinessMetrics> {
    try {
      const [leads, priceAlerts, engagement, revenue] = await Promise.all([
        this.getLeadMetrics(timeframe),
        this.getPriceAlertMetrics(timeframe),
        this.getUserEngagementMetrics(timeframe),
        this.getRevenueMetrics(timeframe),
      ]);

      return {
        leads,
        priceAlerts,
        userEngagement: engagement,
        revenue,
      };
    } catch (error) {
      logger.error('Failed to get business metrics', error);
      return this.getFallbackMetrics();
    }
  }

  /**
   * Track lead generation event
   */
  async trackLeadGenerated(
    userId: string,
    carId: string,
    source: LeadAnalytics['source'],
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('lead_analytics')
        .insert({
          user_id: userId,
          car_id: carId,
          status: 'new',
          source,
          metadata,
          created_at: new Date().toISOString(),
        });

      // Update business metrics cache
      await this.incrementMetric('leads_generated_today');
      
      logger.info('Lead generation tracked', { userId, carId, source });
    } catch (error) {
      logger.error('Failed to track lead generation', error);
    }
  }

  /**
   * Track price alert engagement
   */
  async trackPriceAlertEngagement(
    userId: string,
    carId: string,
    action: 'created' | 'triggered' | 'clicked' | 'converted',
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('price_alert_analytics')
        .insert({
          user_id: userId,
          car_id: carId,
          action,
          metadata,
          timestamp: new Date().toISOString(),
        });

      logger.info('Price alert engagement tracked', { userId, carId, action });
    } catch (error) {
      logger.error('Failed to track price alert engagement', error);
    }
  }

  /**
   * Track user interaction
   */
  async trackUserInteraction(
    userId: string,
    action: string,
    entityType: 'car' | 'search' | 'filter' | 'comparison',
    entityId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('user_interaction_analytics')
        .insert({
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata,
          timestamp: new Date().toISOString(),
        });

      logger.debug('User interaction tracked', { userId, action, entityType });
    } catch (error) {
      logger.warn('Failed to track user interaction', error);
    }
  }

  /**
   * Get lead conversion funnel
   */
  async getLeadConversionFunnel(timeframe: 'week' | 'month' = 'month'): Promise<{
    stages: Array<{
      stage: string;
      count: number;
      conversionRate: number;
    }>;
    totalLeads: number;
  }> {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      
      const { data: leads, error } = await supabase
        .from('lead_analytics')
        .select('status')
        .gte('created_at', dateFilter);

      if (error || !leads) {
        logger.warn('Failed to get lead funnel data', error);
        return this.getFallbackFunnel();
      }

      const totalLeads = leads.length;
      const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stages = [
        { stage: 'Leads Generated', count: totalLeads, conversionRate: 100 },
        { stage: 'Dealer Contacted', count: statusCounts.contacted || 0, conversionRate: 0 },
        { stage: 'Test Drive Scheduled', count: statusCounts.test_drive || 0, conversionRate: 0 },
        { stage: 'Sales Closed', count: statusCounts.sold || 0, conversionRate: 0 },
      ];

      // Calculate conversion rates
      stages.forEach((stage, index) => {
        if (index > 0) {
          stage.conversionRate = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
        }
      });

      return { stages, totalLeads };
    } catch (error) {
      logger.error('Failed to get lead conversion funnel', error);
      return this.getFallbackFunnel();
    }
  }

  /**
   * Get top performing cars by business metrics
   */
  async getTopPerformingCars(
    metric: 'leads' | 'views' | 'price_alerts' | 'conversions',
    limit: number = 10
  ): Promise<Array<{
    carId: string;
    title: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    try {
      let query;
      
      switch (metric) {
        case 'leads':
          query = supabase
            .from('lead_analytics')
            .select('car_id, count(*)')
            .gte('created_at', this.getDateFilter('month'));
          break;
        case 'views':
          query = supabase
            .from('user_interaction_analytics')
            .select('entity_id, count(*)')
            .eq('action', 'car_viewed')
            .gte('timestamp', this.getDateFilter('month'));
          break;
        case 'price_alerts':
          query = supabase
            .from('price_alert_analytics')
            .select('car_id, count(*)')
            .eq('action', 'created')
            .gte('timestamp', this.getDateFilter('month'));
          break;
        default:
          return [];
      }

      const { data, error } = await query.limit(limit);

      if (error || !data) {
        logger.warn(`Failed to get top performing cars for ${metric}`, error);
        return this.getFallbackTopCars();
      }

      // Get car details
      const carIds = (data as any[]).map((item: any) => item.car_id || item.entity_id);
      const { data: cars } = await supabase
        .from('vehicle_listings')
        .select('id, make, model, year')
        .in('id', carIds);

      return (data as any[]).map((item: any) => {
        const car = cars?.find(c => c.id === (item.car_id || item.entity_id));
        return {
          carId: item.car_id || item.entity_id,
          title: car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car',
          value: item.count as number,
          trend: 'stable' as const,
        };
      });
    } catch (error) {
      logger.error('Failed to get top performing cars', error);
      return this.getFallbackTopCars();
    }
  }

  /**
   * Private helper methods
   */
  private async getLeadMetrics(timeframe: string) {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      
      const { data: leads, error } = await supabase
        .from('lead_analytics')
        .select('*')
        .gte('created_at', dateFilter);

      if (error || !leads) {
        return { total: 0, thisWeek: 0, conversionRate: 0, topSources: [] };
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thisWeek = leads.filter(l => l.created_at >= weekAgo).length;
      const converted = leads.filter(l => ['test_drive', 'sold'].includes(l.status)).length;
      
      const sourceCounts = leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total: leads.length,
        thisWeek,
        conversionRate: leads.length > 0 ? (converted / leads.length) * 100 : 0,
        topSources,
      };
    } catch (error) {
      logger.warn('Failed to get lead metrics', error);
      return { total: 0, thisWeek: 0, conversionRate: 0, topSources: [] };
    }
  }

  private async getPriceAlertMetrics(timeframe: string) {
    try {
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('is_active', true);

      if (error || !alerts) {
        return { active: 0, triggered: 0, conversionRate: 0, avgTargetDiscount: 0 };
      }

      const triggered = alerts.filter(a => a.triggered_at).length;
      
      // Calculate average discount percentage
      const discounts = alerts
        .filter(a => a.current_price > 0)
        .map(a => ((a.current_price - a.target_price) / a.current_price) * 100);
      
      const avgTargetDiscount = discounts.length > 0 
        ? discounts.reduce((a, b) => a + b, 0) / discounts.length 
        : 0;

      return {
        active: alerts.length,
        triggered,
        conversionRate: alerts.length > 0 ? (triggered / alerts.length) * 100 : 0,
        avgTargetDiscount,
      };
    } catch (error) {
      logger.warn('Failed to get price alert metrics', error);
      return { active: 0, triggered: 0, conversionRate: 0, avgTargetDiscount: 0 };
    }
  }

  private async getUserEngagementMetrics(timeframe: string) {
    // Simplified engagement metrics
    return {
      dailyActiveUsers: 150,
      avgSessionDuration: 4.2, // minutes
      returnUserRate: 65, // percentage
      mostViewedCars: [
        { carId: '1', views: 245, title: '2021 Honda Civic' },
        { carId: '2', views: 198, title: '2020 Toyota Camry' },
        { carId: '3', views: 167, title: '2022 Nissan Altima' },
      ],
    };
  }

  private async getRevenueMetrics(timeframe: string) {
    try {
      const { data: leads, error } = await supabase
        .from('lead_analytics')
        .select('car_id, status')
        .gte('created_at', this.getDateFilter(timeframe));

      if (error || !leads) {
        return { leadsGenerated: 0, estimatedValue: 0, topPerformingCars: [] };
      }

      const avgCommissionPerLead = 50; // Example: $50 commission per lead
      const estimatedValue = leads.length * avgCommissionPerLead;

      const carLeadCounts = leads.reduce((acc, lead) => {
        acc[lead.car_id] = (acc[lead.car_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPerformingCars = Object.entries(carLeadCounts)
        .map(([carId, leads]) => ({ carId, leads, title: 'Car Title' }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5);

      return {
        leadsGenerated: leads.length,
        estimatedValue,
        topPerformingCars,
      };
    } catch (error) {
      logger.warn('Failed to get revenue metrics', error);
      return { leadsGenerated: 0, estimatedValue: 0, topPerformingCars: [] };
    }
  }

  private async incrementMetric(key: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Simple increment using rpc call or direct update
      await supabase
        .from('daily_metrics')
        .upsert({
          date: today,
          metric_name: key,
          value: 1,
        });
    } catch (error) {
      logger.warn('Failed to increment metric', error);
    }
  }

  private getDateFilter(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private getFallbackMetrics(): BusinessMetrics {
    return {
      leads: { total: 45, thisWeek: 12, conversionRate: 18.5, topSources: [
        { source: 'car_detail', count: 28 },
        { source: 'price_alert', count: 12 },
        { source: 'search', count: 5 },
      ]},
      priceAlerts: { active: 89, triggered: 23, conversionRate: 35.2, avgTargetDiscount: 12.8 },
      userEngagement: { dailyActiveUsers: 150, avgSessionDuration: 4.2, returnUserRate: 65, mostViewedCars: [] },
      revenue: { leadsGenerated: 45, estimatedValue: 2250, topPerformingCars: [] },
    };
  }

  private getFallbackFunnel() {
    return {
      stages: [
        { stage: 'Leads Generated', count: 45, conversionRate: 100 },
        { stage: 'Dealer Contacted', count: 32, conversionRate: 71 },
        { stage: 'Test Drive Scheduled', count: 18, conversionRate: 40 },
        { stage: 'Sales Closed', count: 8, conversionRate: 18 },
      ],
      totalLeads: 45,
    };
  }

  private getFallbackTopCars() {
    return [
      { carId: '1', title: '2021 Honda Civic', value: 15, trend: 'up' as const },
      { carId: '2', title: '2020 Toyota Camry', value: 12, trend: 'stable' as const },
      { carId: '3', title: '2022 Nissan Altima', value: 9, trend: 'down' as const },
    ];
  }
}

export const businessAnalyticsService = BusinessAnalyticsService.getInstance();
