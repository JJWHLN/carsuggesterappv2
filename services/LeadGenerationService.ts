/**
 * Lead Generation Service - Core Business Feature
 * 
 * Connects potential buyers with dealers by managing leads,
 * contact requests, and follow-ups.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface Lead {
  id?: string;
  user_id: string;
  car_id: string;
  dealer_id?: string;
  contact_method: 'phone' | 'email' | 'text' | 'in_person';
  message: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'appointment_set' | 'test_drive_scheduled' | 'closed' | 'lost';
  created_at?: string;
  updated_at?: string;
  
  // Car details for dealer context
  car_make?: string;
  car_model?: string;
  car_year?: number;
  car_price?: number;
}

export interface ContactRequest {
  carId: string;
  carTitle: string;
  contactMethod: 'phone' | 'email' | 'text' | 'in_person';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  availableTimes?: string[];
  interestedInFinancing?: boolean;
  interestedInTrade?: boolean;
}

class LeadGenerationService {
  private static instance: LeadGenerationService;

  static getInstance(): LeadGenerationService {
    if (!LeadGenerationService.instance) {
      LeadGenerationService.instance = new LeadGenerationService();
    }
    return LeadGenerationService.instance;
  }

  /**
   * Submit a lead for a car
   */
  async submitLead(userId: string, contactRequest: ContactRequest): Promise<Lead> {
    try {
      logger.info('Submitting lead for car', contactRequest.carId);

      // Create lead record
      const leadData: Partial<Lead> = {
        user_id: userId,
        car_id: contactRequest.carId,
        contact_method: contactRequest.contactMethod,
        message: contactRequest.message,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Get user details for the lead
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        leadData.user_email = user.user.email;
        // Get additional user profile info if available
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name, phone')
          .eq('user_id', userId)
          .single();
        
        if (profile) {
          leadData.user_name = profile.name;
          leadData.user_phone = profile.phone;
        }
      }

      // Insert lead into database
      const { data: lead, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      logger.info('Lead submitted successfully', lead.id);

      // Send notification to dealer (if dealer system exists)
      try {
        await this.notifyDealer(lead);
      } catch (notificationError) {
        logger.warn('Failed to notify dealer about lead', notificationError);
        // Don't fail the lead submission if notification fails
      }

      // Send confirmation to user
      try {
        await this.sendUserConfirmation(lead);
      } catch (confirmationError) {
        logger.warn('Failed to send user confirmation', confirmationError);
      }

      return lead;
    } catch (error) {
      logger.error('Failed to submit lead', error);
      throw new Error('Failed to submit your inquiry. Please try again.');
    }
  }

  /**
   * Get leads for a user
   */
  async getUserLeads(userId: string): Promise<Lead[]> {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          vehicle_listings (
            make, model, year, price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return leads || [];
    } catch (error) {
      logger.error('Failed to fetch user leads', error);
      return [];
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      logger.info('Lead status updated', { leadId, status });
    } catch (error) {
      logger.error('Failed to update lead status', error);
      throw error;
    }
  }

  /**
   * Schedule test drive
   */
  async scheduleTestDrive(leadId: string, scheduledTime: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'test_drive_scheduled',
          scheduled_time: scheduledTime,
          notes: notes || 'Test drive scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;

      logger.info('Test drive scheduled', { leadId, scheduledTime });
    } catch (error) {
      logger.error('Failed to schedule test drive', error);
      throw error;
    }
  }

  /**
   * Get quick contact info for a car
   */
  async getCarContactInfo(carId: string): Promise<{
    dealerName?: string;
    dealerPhone?: string;
    dealerEmail?: string;
    dealerAddress?: string;
    dealerHours?: string;
  }> {
    try {
      // This would integrate with dealer database when available
      // For now, return mock dealer info
      return {
        dealerName: 'Premier Auto Sales',
        dealerPhone: '(555) 123-4567',
        dealerEmail: 'sales@premierauto.com',
        dealerAddress: '123 Auto Row, Car City, CA 90210',
        dealerHours: 'Mon-Sat 9AM-8PM, Sun 10AM-6PM',
      };
    } catch (error) {
      logger.error('Failed to get car contact info', error);
      return {};
    }
  }

  /**
   * Private: Notify dealer about new lead
   */
  private async notifyDealer(lead: Lead): Promise<void> {
    logger.info('Notifying dealer about new lead', lead.id);
    // Implement dealer notification (email, SMS, dashboard notification)
    // This would integrate with dealer management system
  }

  /**
   * Private: Send confirmation to user
   */
  private async sendUserConfirmation(lead: Lead): Promise<void> {
    logger.info('Sending user confirmation for lead', lead.id);
    // Implement user confirmation (email, in-app notification)
    // "Thank you for your inquiry about [car]. A dealer will contact you within 24 hours."
  }
}

export const leadService = LeadGenerationService.getInstance();
