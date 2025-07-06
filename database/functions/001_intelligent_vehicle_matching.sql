-- Edge Function: Intelligent Vehicle Matching
-- This function uses AI to match users with vehicles based on their preferences and behavior

create or replace function match_vehicles_for_user(
  user_id uuid,
  max_results integer default 10,
  include_preferences boolean default true
)
returns table (
  vehicle_id uuid,
  match_score numeric(3,2),
  match_reasons text[],
  recommendation_type text
)
language plpgsql
security definer
as $$
declare
  user_budget numeric;
  user_location_lat numeric;
  user_location_lng numeric;
  preferred_makes text[];
  preferred_body_types text[];
  user_age integer;
  search_history jsonb;
begin
  -- Get user preferences and profile data
  select 
    coalesce(profile.max_budget, 50000),
    coalesce(profile.location_lat, 0),
    coalesce(profile.location_lng, 0),
    coalesce(profile.preferred_makes, '{}'),
    coalesce(profile.preferred_body_types, '{}'),
    extract(year from age(profile.birth_date)),
    profile.search_history
  into 
    user_budget, user_location_lat, user_location_lng,
    preferred_makes, preferred_body_types, user_age, search_history
  from user_profiles profile
  where profile.user_id = match_vehicles_for_user.user_id;

  return query
  with vehicle_scores as (
    select 
      v.id as vehicle_id,
      -- Base score calculation
      case 
        when v.price <= user_budget then 1.0
        when v.price <= user_budget * 1.2 then 0.8
        when v.price <= user_budget * 1.5 then 0.6
        else 0.3
      end as budget_score,
      
      -- Location proximity score (simplified)
      case 
        when abs(v.location_lat - user_location_lat) < 0.5 
         and abs(v.location_lng - user_location_lng) < 0.5 then 1.0
        when abs(v.location_lat - user_location_lat) < 1.0 
         and abs(v.location_lng - user_location_lng) < 1.0 then 0.8
        when abs(v.location_lat - user_location_lat) < 2.0 
         and abs(v.location_lng - user_location_lng) < 2.0 then 0.6
        else 0.3
      end as location_score,
      
      -- Make preference score
      case 
        when v.make = any(preferred_makes) then 1.0
        else 0.5
      end as make_score,
      
      -- Age-based scoring
      case 
        when user_age < 25 and v.year >= extract(year from current_date) - 5 then 1.0
        when user_age between 25 and 40 and v.year >= extract(year from current_date) - 8 then 1.0
        when user_age > 40 and v.year >= extract(year from current_date) - 10 then 1.0
        else 0.7
      end as age_score,
      
      -- Condition score
      case v.condition
        when 'excellent' then 1.0
        when 'good' then 0.9
        when 'fair' then 0.7
        else 0.5
      end as condition_score,
      
      -- Popularity score based on views and bookmarks
      least(1.0, (v.view_count::numeric / 100.0) + (v.bookmark_count::numeric / 20.0)) as popularity_score,
      
      v.*
    from vehicle_listings v
    where v.status = 'active'
      and v.is_sold = false
  ),
  scored_vehicles as (
    select 
      vehicle_id,
      round(
        (budget_score * 0.3 + 
         location_score * 0.25 + 
         make_score * 0.2 + 
         age_score * 0.1 + 
         condition_score * 0.1 + 
         popularity_score * 0.05) * 100
      ) / 100 as match_score,
      
      -- Generate match reasons
      array_remove(array[
        case when budget_score >= 0.8 then 'Within your budget' end,
        case when location_score >= 0.8 then 'Close to your location' end,
        case when make_score = 1.0 then 'Matches your preferred brand' end,
        case when age_score = 1.0 then 'Age-appropriate vehicle' end,
        case when condition_score >= 0.9 then 'Excellent condition' end,
        case when popularity_score >= 0.8 then 'Popular choice' end
      ], null) as match_reasons,
      
      -- Determine recommendation type
      case 
        when budget_score >= 0.8 and location_score >= 0.8 and make_score = 1.0 then 'Perfect Match'
        when budget_score >= 0.8 and make_score = 1.0 then 'Great Choice'
        when location_score >= 0.8 and condition_score >= 0.9 then 'Local Gem'
        when popularity_score >= 0.8 then 'Popular Pick'
        else 'Good Option'
      end as recommendation_type
      
    from vehicle_scores
    where (budget_score * 0.3 + location_score * 0.25 + make_score * 0.2 + 
           age_score * 0.1 + condition_score * 0.1 + popularity_score * 0.05) >= 0.4
  )
  select 
    sv.vehicle_id,
    sv.match_score,
    sv.match_reasons,
    sv.recommendation_type
  from scored_vehicles sv
  order by sv.match_score desc, random()
  limit max_results;
end;
$$;
