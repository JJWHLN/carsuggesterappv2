-- Edge Function: Dynamic Pricing Intelligence
-- Analyzes market trends and provides pricing recommendations

create or replace function analyze_vehicle_pricing(
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_mileage integer,
  vehicle_condition text,
  location_city text default null,
  location_state text default null
)
returns table (
  suggested_price numeric(10,2),
  price_range_min numeric(10,2),
  price_range_max numeric(10,2),
  market_position text,
  comparable_count integer,
  market_trends jsonb,
  pricing_factors jsonb
)
language plpgsql
security definer
as $$
declare
  base_price numeric;
  condition_multiplier numeric;
  mileage_adjustment numeric;
  age_adjustment numeric;
  location_adjustment numeric;
  market_avg numeric;
  comparable_vehicles_count integer;
  trends jsonb;
begin
  -- Get comparable vehicles (same make, model, similar year)
  select 
    avg(price),
    count(*)
  into market_avg, comparable_vehicles_count
  from vehicle_listings
  where make ilike vehicle_make
    and model ilike vehicle_model
    and year between (vehicle_year - 2) and (vehicle_year + 2)
    and status = 'active'
    and is_sold = false;

  -- If no comparables, use estimated base price
  if market_avg is null then
    -- Simplified base pricing model
    base_price := case 
      when vehicle_year >= extract(year from current_date) then 35000
      when vehicle_year >= extract(year from current_date) - 3 then 28000
      when vehicle_year >= extract(year from current_date) - 6 then 22000
      when vehicle_year >= extract(year from current_date) - 10 then 16000
      else 12000
    end;
    market_avg := base_price;
    comparable_vehicles_count := 0;
  end if;

  -- Calculate condition adjustment
  condition_multiplier := case vehicle_condition
    when 'excellent' then 1.15
    when 'good' then 1.0
    when 'fair' then 0.85
    when 'poor' then 0.70
    else 0.95
  end;

  -- Calculate mileage adjustment (per 10k miles over/under average)
  declare average_mileage integer := (extract(year from current_date) - vehicle_year) * 12000;
  begin
    mileage_adjustment := case 
      when vehicle_mileage < average_mileage then 
        1.0 + ((average_mileage - vehicle_mileage) / 10000.0 * 0.03)
      else 
        1.0 - ((vehicle_mileage - average_mileage) / 10000.0 * 0.05)
    end;
    
    -- Cap the adjustment
    mileage_adjustment := greatest(0.70, least(1.30, mileage_adjustment));
  end;

  -- Calculate age adjustment
  age_adjustment := case 
    when vehicle_year >= extract(year from current_date) then 1.0
    when vehicle_year >= extract(year from current_date) - 1 then 0.95
    when vehicle_year >= extract(year from current_date) - 3 then 0.90
    when vehicle_year >= extract(year from current_date) - 6 then 0.85
    when vehicle_year >= extract(year from current_date) - 10 then 0.80
    else 0.75
  end;

  -- Location adjustment (simplified - premium markets)
  location_adjustment := case 
    when location_city ilike any(array['Los Angeles', 'San Francisco', 'New York', 'Boston', 'Seattle']) then 1.10
    when location_city ilike any(array['Chicago', 'Miami', 'Denver', 'Austin', 'Portland']) then 1.05
    when location_state ilike any(array['CA', 'NY', 'MA', 'WA']) then 1.03
    else 1.0
  end;

  -- Calculate final suggested price
  suggested_price := round(market_avg * condition_multiplier * mileage_adjustment * 
                          age_adjustment * location_adjustment, 2);

  -- Calculate price range (±15%)
  price_range_min := round(suggested_price * 0.85, 2);
  price_range_max := round(suggested_price * 1.15, 2);

  -- Determine market position
  market_position := case 
    when suggested_price > market_avg * 1.1 then 'Premium'
    when suggested_price > market_avg * 1.05 then 'Above Average'
    when suggested_price < market_avg * 0.9 then 'Below Average'
    when suggested_price < market_avg * 0.85 then 'Budget'
    else 'Average'
  end;

  -- Generate market trends data
  with recent_sales as (
    select 
      date_trunc('month', created_at) as month,
      avg(price) as avg_price,
      count(*) as sales_count
    from vehicle_listings
    where make ilike vehicle_make
      and model ilike vehicle_model
      and created_at >= current_date - interval '6 months'
      and status = 'sold'
    group by date_trunc('month', created_at)
    order by month desc
    limit 6
  )
  select jsonb_build_object(
    'monthly_trends', jsonb_agg(
      jsonb_build_object(
        'month', to_char(month, 'YYYY-MM'),
        'average_price', avg_price,
        'sales_volume', sales_count
      ) order by month desc
    ),
    'trend_direction', case 
      when (select avg_price from recent_sales order by month desc limit 1) > 
           (select avg_price from recent_sales order by month asc limit 1) then 'increasing'
      when (select avg_price from recent_sales order by month desc limit 1) < 
           (select avg_price from recent_sales order by month asc limit 1) then 'decreasing'
      else 'stable'
    end
  ) into trends
  from recent_sales;

  -- Generate pricing factors explanation
  declare factors jsonb;
  begin
    factors := jsonb_build_object(
      'base_market_price', market_avg,
      'condition_adjustment', jsonb_build_object(
        'factor', condition_multiplier,
        'impact', round((condition_multiplier - 1.0) * 100, 1) || '%'
      ),
      'mileage_adjustment', jsonb_build_object(
        'factor', mileage_adjustment,
        'impact', round((mileage_adjustment - 1.0) * 100, 1) || '%',
        'vehicle_mileage', vehicle_mileage,
        'average_expected', (extract(year from current_date) - vehicle_year) * 12000
      ),
      'age_adjustment', jsonb_build_object(
        'factor', age_adjustment,
        'impact', round((age_adjustment - 1.0) * 100, 1) || '%'
      ),
      'location_adjustment', jsonb_build_object(
        'factor', location_adjustment,
        'impact', round((location_adjustment - 1.0) * 100, 1) || '%'
      )
    );
  end;

  return query select 
    analyze_vehicle_pricing.suggested_price,
    analyze_vehicle_pricing.price_range_min,
    analyze_vehicle_pricing.price_range_max,
    analyze_vehicle_pricing.market_position,
    analyze_vehicle_pricing.comparable_vehicles_count,
    coalesce(trends, '{}'::jsonb) as market_trends,
    factors as pricing_factors;
end;
$$;
