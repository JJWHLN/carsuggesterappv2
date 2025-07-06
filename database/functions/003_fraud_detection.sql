-- Edge Function: Fraud Detection and Prevention
-- Analyzes listings and user behavior for potential fraud indicators

create or replace function detect_potential_fraud(
  listing_id uuid default null,
  user_id uuid default null,
  check_type text default 'comprehensive' -- 'listing', 'user', 'comprehensive'
)
returns table (
  risk_level text,
  risk_score numeric(3,2),
  risk_factors jsonb,
  recommendations text[],
  requires_review boolean
)
language plpgsql
security definer
as $$
declare
  listing_risk_score numeric := 0;
  user_risk_score numeric := 0;
  total_risk_score numeric;
  risk_factors_obj jsonb := '{}';
  recommendations_array text[] := '{}';
begin
  -- Listing-based fraud detection
  if check_type in ('listing', 'comprehensive') and listing_id is not null then
    declare
      listing_data record;
      price_analysis record;
      similar_listings_count integer;
      image_analysis record;
    begin
      -- Get listing data
      select * into listing_data
      from vehicle_listings
      where id = listing_id;

      if listing_data.id is not null then
        -- Price analysis - check for unrealistic pricing
        select * into price_analysis
        from analyze_vehicle_pricing(
          listing_data.make,
          listing_data.model,
          listing_data.year,
          listing_data.mileage,
          listing_data.condition
        );

        -- Check if price is suspiciously low
        if listing_data.price < price_analysis.price_range_min * 0.7 then
          listing_risk_score := listing_risk_score + 0.4;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'suspiciously_low_price', jsonb_build_object(
              'severity', 'high',
              'listing_price', listing_data.price,
              'market_min', price_analysis.price_range_min,
              'discount_percentage', round((1 - listing_data.price / price_analysis.price_range_min) * 100, 1)
            )
          );
          recommendations_array := recommendations_array || 'Verify pricing with seller and request additional documentation';
        end if;

        -- Check for duplicate or very similar listings
        select count(*) into similar_listings_count
        from vehicle_listings
        where make = listing_data.make
          and model = listing_data.model
          and year = listing_data.year
          and abs(price - listing_data.price) < listing_data.price * 0.1
          and id != listing_id
          and created_at >= current_date - interval '30 days';

        if similar_listings_count > 3 then
          listing_risk_score := listing_risk_score + 0.2;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'duplicate_listings', jsonb_build_object(
              'severity', 'medium',
              'similar_count', similar_listings_count
            )
          );
          recommendations_array := recommendations_array || 'Check for duplicate listings from same or different sellers';
        end if;

        -- Check description for red flags
        declare
          description_lower text := lower(listing_data.description);
          red_flag_count integer := 0;
        begin
          -- Count red flag phrases
          if description_lower ~ '(urgent|must sell|leaving country|military deployment|cash only|no inspection)' then
            red_flag_count := red_flag_count + 1;
          end if;
          
          if description_lower ~ '(wire transfer|western union|paypal|venmo|zelle)' then
            red_flag_count := red_flag_count + 1;
          end if;

          if red_flag_count > 0 then
            listing_risk_score := listing_risk_score + (red_flag_count * 0.15);
            risk_factors_obj := risk_factors_obj || jsonb_build_object(
              'suspicious_description', jsonb_build_object(
                'severity', case when red_flag_count > 1 then 'high' else 'medium' end,
                'red_flag_count', red_flag_count
              )
            );
            recommendations_array := recommendations_array || 'Review listing description for potential scam indicators';
          end if;
        end;

        -- Check image count and quality indicators
        if array_length(listing_data.images, 1) < 3 then
          listing_risk_score := listing_risk_score + 0.1;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'insufficient_images', jsonb_build_object(
              'severity', 'low',
              'image_count', array_length(listing_data.images, 1)
            )
          );
          recommendations_array := recommendations_array || 'Request additional vehicle photos';
        end if;

        -- Check for rapid price changes
        declare price_change_count integer;
        begin
          select count(*) into price_change_count
          from listing_price_history
          where listing_id = detect_potential_fraud.listing_id
            and created_at >= current_date - interval '7 days';

          if price_change_count > 3 then
            listing_risk_score := listing_risk_score + 0.15;
            risk_factors_obj := risk_factors_obj || jsonb_build_object(
              'frequent_price_changes', jsonb_build_object(
                'severity', 'medium',
                'changes_count', price_change_count
              )
            );
            recommendations_array := recommendations_array || 'Investigate frequent price changes';
          end if;
        end;
      end if;
    end;
  end if;

  -- User-based fraud detection
  if check_type in ('user', 'comprehensive') and user_id is not null then
    declare
      user_data record;
      account_age interval;
      recent_listings_count integer;
      user_reports_count integer;
    begin
      -- Get user data
      select 
        u.*,
        up.verification_status,
        up.phone_verified,
        up.email_verified
      into user_data
      from users u
      left join user_profiles up on u.id = up.user_id
      where u.id = detect_potential_fraud.user_id;

      if user_data.id is not null then
        -- Check account age
        account_age := current_timestamp - user_data.created_at;
        if account_age < interval '7 days' then
          user_risk_score := user_risk_score + 0.3;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'new_account', jsonb_build_object(
              'severity', 'high',
              'account_age_days', extract(days from account_age)
            )
          );
          recommendations_array := recommendations_array || 'New account - require additional verification';
        end if;

        -- Check verification status
        if not coalesce(user_data.email_verified, false) then
          user_risk_score := user_risk_score + 0.15;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'unverified_email', jsonb_build_object('severity', 'medium')
          );
          recommendations_array := recommendations_array || 'Require email verification';
        end if;

        if not coalesce(user_data.phone_verified, false) then
          user_risk_score := user_risk_score + 0.2;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'unverified_phone', jsonb_build_object('severity', 'medium')
          );
          recommendations_array := recommendations_array || 'Require phone verification';
        end if;

        -- Check for excessive listing activity
        select count(*) into recent_listings_count
        from vehicle_listings
        where seller_id = user_id
          and created_at >= current_date - interval '7 days';

        if recent_listings_count > 10 then
          user_risk_score := user_risk_score + 0.25;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'excessive_listings', jsonb_build_object(
              'severity', 'high',
              'recent_count', recent_listings_count
            )
          );
          recommendations_array := recommendations_array || 'Investigate high-volume listing activity';
        end if;

        -- Check for user reports
        select count(*) into user_reports_count
        from user_reports
        where reported_user_id = user_id
          and created_at >= current_date - interval '30 days'
          and status != 'resolved_false';

        if user_reports_count > 2 then
          user_risk_score := user_risk_score + 0.3;
          risk_factors_obj := risk_factors_obj || jsonb_build_object(
            'multiple_reports', jsonb_build_object(
              'severity', 'high',
              'report_count', user_reports_count
            )
          );
          recommendations_array := recommendations_array || 'Multiple user reports - investigate thoroughly';
        end if;
      end if;
    end;
  end if;

  -- Calculate total risk score
  total_risk_score := case check_type
    when 'listing' then listing_risk_score
    when 'user' then user_risk_score
    else greatest(listing_risk_score, user_risk_score)
  end;

  -- Cap at 1.0
  total_risk_score := least(1.0, total_risk_score);

  -- Determine risk level
  declare risk_level_result text;
  begin
    risk_level_result := case 
      when total_risk_score >= 0.7 then 'HIGH'
      when total_risk_score >= 0.4 then 'MEDIUM'
      when total_risk_score >= 0.2 then 'LOW'
      else 'MINIMAL'
    end;
  end;

  return query select 
    risk_level_result,
    total_risk_score,
    risk_factors_obj,
    recommendations_array,
    total_risk_score >= 0.4 as requires_review;
end;
$$;
