-- =====================================================
-- CarSuggester Business Tables - Supabase SQL Schema
-- =====================================================
-- This script adds the missing business-critical tables
-- to your existing CarSuggester Supabase database
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHASE 1: REVENUE GENERATION TABLES (CRITICAL)
-- =====================================================

-- 1. DEALER SUBSCRIPTIONS TABLE
-- Manages dealer subscription plans and billing
CREATE TABLE IF NOT EXISTS dealer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
  monthly_fee DECIMAL(8,2) NOT NULL,
  max_listings INTEGER NOT NULL,
  featured_listings INTEGER NOT NULL DEFAULT 0,
  analytics_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  next_billing_date DATE,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active subscription per dealer
  UNIQUE(dealer_id) WHERE is_active = TRUE
);

-- Indexes for dealer_subscriptions
CREATE INDEX IF NOT EXISTS idx_dealer_subscriptions_dealer_id ON dealer_subscriptions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_subscriptions_plan_type ON dealer_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_dealer_subscriptions_billing_date ON dealer_subscriptions(next_billing_date);

-- 2. PAYMENT TRANSACTIONS TABLE
-- Tracks all payment transactions with Stripe
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES dealer_subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_method TEXT, -- 'card', 'bank_transfer', 'ach', etc.
  failure_reason TEXT,
  failure_code TEXT,
  refund_amount_cents INTEGER DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (amount_cents > 0),
  CHECK (refund_amount_cents >= 0),
  CHECK (refund_amount_cents <= amount_cents)
);

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_dealer_id ON payment_transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);

-- 3. PREMIUM USER SUBSCRIPTIONS TABLE
-- Manages premium user subscriptions
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium_monthly', 'premium_yearly', 'premium_lifetime')),
  monthly_fee DECIMAL(6,2) NOT NULL,
  features JSONB DEFAULT '{}', -- Premium features: {"unlimited_searches": true, "price_alerts": true, "priority_support": true}
  is_active BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  next_billing_date DATE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id) WHERE is_active = TRUE
);

-- Indexes for premium_subscriptions
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_plan_type ON premium_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_billing_date ON premium_subscriptions(next_billing_date);

-- =====================================================
-- PHASE 2: ANALYTICS & BUSINESS INTELLIGENCE TABLES
-- =====================================================

-- 4. USER ANALYTICS TABLE
-- Tracks user behavior and interactions
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'search', 'view_car', 'contact_dealer', 'save_car', 'page_view', 'click'
  event_data JSONB DEFAULT '{}', -- Additional event data
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioning indexes for user_analytics (for performance)
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics(session_id);

-- 5. LEAD CONVERSION TRACKING TABLE
-- Tracks lead conversions and calculates commissions
CREATE TABLE IF NOT EXISTS lead_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES dealer_leads(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_listing_id UUID REFERENCES vehicle_listings(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('sale', 'appointment', 'test_drive', 'quote_request', 'financing_inquiry')),
  sale_amount DECIMAL(10,2), -- If it's a sale
  commission_rate DECIMAL(4,4) DEFAULT 0.02, -- 2% default commission
  commission_amount DECIMAL(8,2),
  conversion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by_dealer BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'processed', 'paid', 'disputed')),
  payout_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (sale_amount IS NULL OR sale_amount > 0),
  CHECK (commission_amount IS NULL OR commission_amount >= 0)
);

-- Indexes for lead_conversions
CREATE INDEX IF NOT EXISTS idx_lead_conversions_lead_id ON lead_conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_dealer_id ON lead_conversions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_conversion_date ON lead_conversions(conversion_date);
CREATE INDEX IF NOT EXISTS idx_lead_conversions_payout_status ON lead_conversions(payout_status);

-- =====================================================
-- PHASE 3: AI & SEARCH ENHANCEMENT TABLES
-- =====================================================

-- 6. AI SEARCH QUERIES TABLE
-- Tracks AI-powered search queries and performance
CREATE TABLE IF NOT EXISTS ai_search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  original_query TEXT NOT NULL,
  parsed_intent JSONB DEFAULT '{}', -- OpenAI parsed intent: {"intent": "buy", "budget": 25000, "brand": "BMW"}
  search_filters JSONB DEFAULT '{}', -- Generated filters applied to search
  results_count INTEGER DEFAULT 0,
  clicked_results INTEGER DEFAULT 0,
  conversion_rate DECIMAL(4,4) DEFAULT 0,
  processing_time_ms INTEGER,
  openai_tokens_used INTEGER,
  openai_cost_cents INTEGER, -- Track OpenAI API costs
  search_quality_score DECIMAL(3,2), -- 1-10 quality rating
  user_satisfaction DECIMAL(3,2), -- User feedback on results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (results_count >= 0),
  CHECK (clicked_results >= 0),
  CHECK (clicked_results <= results_count),
  CHECK (search_quality_score IS NULL OR (search_quality_score >= 1 AND search_quality_score <= 10))
);

-- Indexes for ai_search_queries
CREATE INDEX IF NOT EXISTS idx_ai_search_queries_created_at ON ai_search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_search_queries_user_id ON ai_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_queries_session_id ON ai_search_queries(session_id);

-- 7. USER PREFERENCES TABLE
-- Stores user preferences for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_brands TEXT[],
  preferred_fuel_types TEXT[], -- 'gasoline', 'hybrid', 'electric', 'diesel'
  preferred_transmissions TEXT[], -- 'manual', 'automatic', 'cvt'
  body_styles TEXT[], -- 'sedan', 'suv', 'hatchback', 'coupe', 'truck'
  preferred_years INTEGER[],
  max_mileage INTEGER,
  location_radius INTEGER DEFAULT 50, -- miles
  notification_preferences JSONB DEFAULT '{}', -- {"price_alerts": true, "new_listings": true, "email": true, "push": true}
  search_weights JSONB DEFAULT '{}', -- AI preference weights: {"price": 0.8, "mileage": 0.6, "brand": 0.9}
  ai_learning_consent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (budget_min IS NULL OR budget_min > 0),
  CHECK (budget_max IS NULL OR budget_max > 0),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max > budget_min),
  CHECK (max_mileage IS NULL OR max_mileage > 0),
  CHECK (location_radius > 0)
);

-- Index for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- PHASE 4: NOTIFICATION & COMMUNICATION TABLES
-- =====================================================

-- 8. NOTIFICATIONS TABLE
-- Manages in-app and push notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price_drop', 'new_listing', 'dealer_response', 'system', 'promotion', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data: {"car_id": "123", "dealer_id": "456", "old_price": 25000, "new_price": 23000}
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=low, 5=urgent
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 9. PRICE DROP ALERTS TABLE
-- Manages price drop alerts for users
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  price_drop_threshold DECIMAL(5,2) DEFAULT 5.00, -- Minimum price drop percentage to trigger
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT FALSE,
  times_triggered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (target_price > 0),
  CHECK (current_price > 0),
  CHECK (price_drop_threshold > 0),
  CHECK (times_triggered >= 0)
);

-- Unique constraint and indexes for price_alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alerts_unique_active 
ON price_alerts(user_id, vehicle_listing_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_price_alerts_vehicle_listing ON price_alerts(vehicle_listing_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered ON price_alerts(triggered_at) WHERE triggered_at IS NOT NULL;

-- =====================================================
-- PHASE 5: BUSINESS REPORTING TABLES
-- =====================================================

-- 10. MONTHLY BUSINESS METRICS TABLE
-- Stores aggregated monthly business metrics
CREATE TABLE IF NOT EXISTS monthly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  
  -- User Metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  premium_users INTEGER DEFAULT 0,
  
  -- Dealer Metrics
  total_dealers INTEGER DEFAULT 0,
  new_dealers INTEGER DEFAULT 0,
  active_dealers INTEGER DEFAULT 0,
  premium_dealers INTEGER DEFAULT 0,
  
  -- Content Metrics
  total_listings INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,
  featured_listings INTEGER DEFAULT 0,
  sold_listings INTEGER DEFAULT 0,
  
  -- Activity Metrics
  total_searches INTEGER DEFAULT 0,
  ai_searches INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  lead_conversion_rate DECIMAL(4,4) DEFAULT 0,
  
  -- Revenue Metrics
  revenue_from_dealers DECIMAL(10,2) DEFAULT 0,
  revenue_from_premium DECIMAL(10,2) DEFAULT 0,
  revenue_from_commissions DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Cost Metrics
  openai_costs DECIMAL(8,2) DEFAULT 0,
  hosting_costs DECIMAL(8,2) DEFAULT 0,
  total_costs DECIMAL(8,2) DEFAULT 0,
  
  -- Performance Metrics
  avg_search_time_ms INTEGER DEFAULT 0,
  avg_page_load_time_ms INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,4) DEFAULT 99.99,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for year/month
  UNIQUE(year, month)
);

-- Index for monthly_metrics
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_year_month ON monthly_metrics(year, month);

-- =====================================================
-- ADDITIONAL BUSINESS SUPPORT TABLES
-- =====================================================

-- 11. SAVED SEARCH ALERTS TABLE
-- Manages saved search alerts for users
CREATE TABLE IF NOT EXISTS saved_search_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- Search filters and criteria
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  results_since_last_trigger INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for saved_search_alerts
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_user_id ON saved_search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_active ON saved_search_alerts(is_active) WHERE is_active = TRUE;

-- 12. DEALER PERFORMANCE METRICS TABLE
-- Tracks individual dealer performance
CREATE TABLE IF NOT EXISTS dealer_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Listing Metrics
  total_listings INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  featured_listings INTEGER DEFAULT 0,
  sold_listings INTEGER DEFAULT 0,
  avg_listing_views INTEGER DEFAULT 0,
  
  -- Lead Metrics
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  lead_response_time_hours DECIMAL(6,2),
  
  -- Financial Metrics
  total_sales_value DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  subscription_revenue DECIMAL(8,2) DEFAULT 0,
  
  -- Quality Metrics
  customer_rating DECIMAL(3,2),
  response_rate DECIMAL(4,4),
  customer_satisfaction DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for dealer/period
  UNIQUE(dealer_id, period_start, period_end)
);

-- Index for dealer_performance_metrics
CREATE INDEX IF NOT EXISTS idx_dealer_performance_dealer_period ON dealer_performance_metrics(dealer_id, period_start);

-- =====================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_dealer_subscriptions_updated_at 
  BEFORE UPDATE ON dealer_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_subscriptions_updated_at 
  BEFORE UPDATE ON premium_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_alerts_updated_at 
  BEFORE UPDATE ON price_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_search_alerts_updated_at 
  BEFORE UPDATE ON saved_search_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_metrics_updated_at 
  BEFORE UPDATE ON monthly_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate commission amount on lead conversions
CREATE OR REPLACE FUNCTION calculate_lead_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate commission amount based on sale amount and rate
    IF NEW.sale_amount IS NOT NULL AND NEW.commission_rate IS NOT NULL THEN
        NEW.commission_amount = NEW.sale_amount * NEW.commission_rate;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically calculate commission
CREATE TRIGGER calculate_commission_trigger
  BEFORE INSERT OR UPDATE ON lead_conversions
  FOR EACH ROW EXECUTE FUNCTION calculate_lead_commission();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dealer_subscriptions
CREATE POLICY "Dealers can view own subscriptions" ON dealer_subscriptions
  FOR SELECT USING (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all subscriptions" ON dealer_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for premium_subscriptions
CREATE POLICY "Users can view own premium subscriptions" ON premium_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own premium subscriptions" ON premium_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for price_alerts
CREATE POLICY "Users can manage own price alerts" ON price_alerts
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for saved_search_alerts
CREATE POLICY "Users can manage own saved search alerts" ON saved_search_alerts
  FOR ALL USING (user_id = auth.uid());

-- Admin-only policies for business metrics
CREATE POLICY "Admins can view monthly metrics" ON monthly_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Dealers can view own performance metrics" ON dealer_performance_metrics
  FOR SELECT USING (dealer_id IN (
    SELECT id FROM dealers WHERE user_id = auth.uid()
  ));

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default subscription plans (you can modify these)
INSERT INTO dealer_subscriptions (dealer_id, plan_type, monthly_fee, max_listings, featured_listings, analytics_access, priority_support)
SELECT 
  d.id,
  'basic',
  49.99,
  25,
  2,
  false,
  false
FROM dealers d
WHERE NOT EXISTS (
  SELECT 1 FROM dealer_subscriptions ds WHERE ds.dealer_id = d.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Add a comment to verify successful completion
COMMENT ON TABLE dealer_subscriptions IS 'CarSuggester Business Tables - Successfully Created';

-- Create a view for quick business metrics overview
CREATE OR REPLACE VIEW business_overview AS
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Active Dealers' as metric,
  COUNT(*)::text as value
FROM dealers
UNION ALL
SELECT 
  'Total Listings' as metric,
  COUNT(*)::text as value
FROM vehicle_listings
WHERE status = 'active'
UNION ALL
SELECT 
  'Premium Subscribers' as metric,
  COUNT(*)::text as value
FROM premium_subscriptions
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON business_overview TO authenticated;
