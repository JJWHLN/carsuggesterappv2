-- ===================================================================
-- CAR SUGGESTER APP - DATABASE SCHEMA FOR CONTENT-FIRST STRATEGY
-- ===================================================================
-- This schema supports your business model:
-- Reviews → Traffic → Dealers → Subscriptions ($99-$499/month)

-- Enable UUID extension for auto-generated IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- 1. CAR REVIEWS TABLE (Core of your content strategy)
-- ===================================================================
CREATE TABLE car_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Car Information
    car_make VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    car_year INTEGER NOT NULL CHECK (car_year >= 1900 AND car_year <= 2030),
    
    -- Reviewer Information
    reviewer_name VARCHAR(100) NOT NULL,
    reviewer_title VARCHAR(100), -- e.g., "Automotive Journalist", "Car Enthusiast"
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pros TEXT[], -- Array of pros as strings
    cons TEXT[], -- Array of cons as strings
    final_verdict TEXT NOT NULL,
    
    -- Media
    images TEXT[], -- Array of image URLs
    video_url TEXT,
    
    -- Publishing
    publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    
    -- Engagement Metrics (Critical for tracking traffic growth)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- SEO and Categorization
    tags TEXT[], -- Array of tags like ["luxury", "fuel-efficient", "family-car"]
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_car_reviews_make_model ON car_reviews(car_make, car_model);
CREATE INDEX idx_car_reviews_published ON car_reviews(is_published, publish_date DESC);
CREATE INDEX idx_car_reviews_featured ON car_reviews(is_featured, publish_date DESC);
CREATE INDEX idx_car_reviews_views ON car_reviews(view_count DESC);
CREATE INDEX idx_car_reviews_rating ON car_reviews(rating DESC);

-- ===================================================================
-- 2. CAR LISTINGS MASTER (Cars available for review/dealer listings)
-- ===================================================================
CREATE TABLE car_listings_master (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic Car Information
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
    
    -- Pricing (Important for dealer monetization)
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    starting_msrp DECIMAL(10,2),
    
    -- Technical Specifications
    body_type VARCHAR(50), -- sedan, suv, hatchback, etc.
    fuel_type VARCHAR(50), -- gasoline, hybrid, electric, diesel
    transmission VARCHAR(50), -- automatic, manual, cvt
    engine_size VARCHAR(20),
    
    -- Safety and Efficiency
    safety_rating DECIMAL(2,1) CHECK (safety_rating >= 0 AND safety_rating <= 5),
    fuel_economy_city INTEGER,
    fuel_economy_highway INTEGER,
    
    -- Features and Options
    key_features TEXT[],
    available_colors TEXT[],
    
    -- Review Integration (Links to your content)
    review_score DECIMAL(2,1) CHECK (review_score >= 0 AND review_score <= 5),
    review_count INTEGER DEFAULT 0,
    
    -- Business Metrics
    is_popular BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'upcoming')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(make, model, year)
);

-- Indexes for car listings
CREATE INDEX idx_car_listings_make_model ON car_listings_master(make, model);
CREATE INDEX idx_car_listings_popular ON car_listings_master(is_popular, review_count DESC);
CREATE INDEX idx_car_listings_price ON car_listings_master(starting_msrp);
CREATE INDEX idx_car_listings_reviews ON car_listings_master(review_count DESC, review_score DESC);

-- ===================================================================
-- 3. DEALERS TABLE (Your revenue source - $99-$499/month subscriptions)
-- ===================================================================
CREATE TABLE dealers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Business Information
    business_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Subscription Details (Your monetization!)
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    monthly_fee DECIMAL(6,2) NOT NULL DEFAULT 99.00,
    subscription_start_date DATE,
    subscription_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Business Metrics
    total_listings INTEGER DEFAULT 0,
    total_leads_received INTEGER DEFAULT 0,
    
    -- Onboarding and Support
    onboarding_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dealers
CREATE INDEX idx_dealers_active ON dealers(is_active, subscription_tier);
CREATE INDEX idx_dealers_location ON dealers(city, state);
CREATE INDEX idx_dealers_subscription ON dealers(subscription_end_date);

-- ===================================================================
-- 4. DEALER LISTINGS (Cars dealers pay to list)
-- ===================================================================
CREATE TABLE dealer_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- References
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    car_listing_id UUID REFERENCES car_listings_master(id) ON DELETE SET NULL,
    
    -- Specific Listing Details
    vin VARCHAR(17),
    mileage INTEGER,
    condition VARCHAR(20) CHECK (condition IN ('new', 'used', 'certified')),
    asking_price DECIMAL(10,2) NOT NULL,
    
    -- Listing Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    images TEXT[],
    
    -- Features specific to this listing
    exterior_color VARCHAR(50),
    interior_color VARCHAR(50),
    features TEXT[],
    
    -- Business Metrics
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0, -- Leads generated
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    listing_date DATE DEFAULT CURRENT_DATE,
    sold_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dealer listings
CREATE INDEX idx_dealer_listings_dealer ON dealer_listings(dealer_id, is_active);
CREATE INDEX idx_dealer_listings_car ON dealer_listings(car_listing_id);
CREATE INDEX idx_dealer_listings_price ON dealer_listings(asking_price);
CREATE INDEX idx_dealer_listings_condition ON dealer_listings(condition, asking_price);

-- ===================================================================
-- 5. ANALYTICS AND BUSINESS INTELLIGENCE
-- ===================================================================
CREATE TABLE daily_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- Content Metrics (Track your content strategy success)
    total_reviews INTEGER DEFAULT 0,
    total_review_views INTEGER DEFAULT 0,
    total_review_likes INTEGER DEFAULT 0,
    new_reviews_today INTEGER DEFAULT 0,
    
    -- Traffic Metrics (Proof of concept for dealers)
    total_page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    search_queries INTEGER DEFAULT 0,
    
    -- Business Metrics (Revenue tracking)
    active_dealers INTEGER DEFAULT 0,
    new_dealers_today INTEGER DEFAULT 0,
    total_monthly_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Listing Metrics
    total_active_listings INTEGER DEFAULT 0,
    new_listings_today INTEGER DEFAULT 0,
    total_leads_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 6. UTILITY FUNCTIONS FOR YOUR BUSINESS
-- ===================================================================

-- Function to get popular cars (for the analytics)
CREATE OR REPLACE FUNCTION get_popular_cars(review_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    car_name TEXT,
    review_count BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT(car_make, ' ', car_model) as car_name,
        COUNT(*) as review_count,
        ROUND(AVG(rating), 1) as average_rating
    FROM car_reviews 
    WHERE is_published = true
    GROUP BY car_make, car_model
    ORDER BY COUNT(*) DESC, AVG(rating) DESC
    LIMIT review_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update car listing stats when reviews are added
CREATE OR REPLACE FUNCTION update_car_listing_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the car listing with new review stats
    INSERT INTO car_listings_master (make, model, year, review_count, review_score, updated_at)
    VALUES (NEW.car_make, NEW.car_model, NEW.car_year, 1, NEW.rating, NOW())
    ON CONFLICT (make, model, year) 
    DO UPDATE SET 
        review_count = (
            SELECT COUNT(*) 
            FROM car_reviews 
            WHERE car_make = NEW.car_make 
                AND car_model = NEW.car_model 
                AND car_year = NEW.car_year 
                AND is_published = true
        ),
        review_score = (
            SELECT ROUND(AVG(rating), 1) 
            FROM car_reviews 
            WHERE car_make = NEW.car_make 
                AND car_model = NEW.car_model 
                AND car_year = NEW.car_year 
                AND is_published = true
        ),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update car listings when reviews are added
CREATE TRIGGER trigger_update_car_listing_from_reviews
    AFTER INSERT OR UPDATE ON car_reviews
    FOR EACH ROW
    WHEN (NEW.is_published = true)
    EXECUTE FUNCTION update_car_listing_from_reviews();

-- Function to calculate monthly revenue from dealers
CREATE OR REPLACE FUNCTION calculate_monthly_revenue()
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_revenue DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(monthly_fee), 0)
    INTO total_revenue
    FROM dealers 
    WHERE is_active = true 
        AND subscription_end_date >= CURRENT_DATE;
    
    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 7. SEED DATA FOR YOUR CONTENT STRATEGY
-- ===================================================================

-- Insert some initial car data to review
INSERT INTO car_listings_master (make, model, year, body_type, fuel_type, transmission, starting_msrp, is_popular, status) VALUES
('Toyota', 'Camry', 2024, 'sedan', 'gasoline', 'automatic', 28400.00, true, 'active'),
('Honda', 'Civic', 2024, 'sedan', 'gasoline', 'automatic', 24700.00, true, 'active'),
('Tesla', 'Model 3', 2024, 'sedan', 'electric', 'automatic', 42990.00, true, 'active'),
('Ford', 'F-150', 2024, 'truck', 'gasoline', 'automatic', 37145.00, true, 'active'),
('Hyundai', 'Elantra', 2024, 'sedan', 'gasoline', 'automatic', 23700.00, false, 'active'),
('Nissan', 'Altima', 2024, 'sedan', 'gasoline', 'automatic', 25290.00, false, 'active'),
('BMW', '3 Series', 2024, 'sedan', 'gasoline', 'automatic', 43800.00, false, 'active'),
('Mercedes-Benz', 'C-Class', 2024, 'sedan', 'gasoline', 'automatic', 48050.00, false, 'active');

-- ===================================================================
-- 8. ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ===================================================================

-- Enable RLS
ALTER TABLE car_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_listings_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_listings ENABLE ROW LEVEL SECURITY;

-- Policy for published reviews (public access)
CREATE POLICY "Public can view published reviews" ON car_reviews
    FOR SELECT USING (is_published = true);

-- Policy for car listings (public access)
CREATE POLICY "Public can view active car listings" ON car_listings_master
    FOR SELECT USING (status = 'active');

-- Policy for dealer listings (public access to active listings)
CREATE POLICY "Public can view active dealer listings" ON dealer_listings
    FOR SELECT USING (is_active = true);

-- Dealers can only see their own data
CREATE POLICY "Dealers can manage their own data" ON dealers
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Dealers can manage their own listings" ON dealer_listings
    FOR ALL USING (dealer_id IN (SELECT id FROM dealers WHERE auth.uid()::text = id::text));

-- ===================================================================
-- SUMMARY
-- ===================================================================
-- This schema supports your content-first business strategy:
-- 
-- 1. CONTENT PHASE: Use car_reviews table to create compelling content
-- 2. TRAFFIC PHASE: Track analytics to show traffic growth to potential dealers
-- 3. DEALER PHASE: Use dealers table to onboard paying customers ($99-$499/month)
-- 4. SCALE PHASE: Use dealer_listings and analytics to optimize revenue
--
-- Key Business Metrics to Track:
-- - Review count and views (content success)
-- - Dealer signups (conversion from traffic)
-- - Monthly recurring revenue (subscription growth)
-- - Leads generated for dealers (value demonstration)
-- ===================================================================
