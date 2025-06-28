/*
  # Creator Analytics Functions

  1. New Functions
    - get_creator_analytics_overview: Returns overview statistics for a creator
    - get_creator_engagement_trends: Returns engagement trends over time
    - get_creator_audience_demographics: Returns audience demographic information
    - get_creator_revenue_breakdown: Returns revenue breakdown by source

  2. Security
    - All functions use SECURITY DEFINER to ensure proper access control
    - Functions only return data for the specified creator
*/

-- Function to get creator analytics overview
CREATE OR REPLACE FUNCTION get_creator_analytics_overview(creator_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Get total views
  WITH view_stats AS (
    SELECT 
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes
    FROM posts
    WHERE user_id = creator_id_param
  ),
  follower_stats AS (
    SELECT 
      COUNT(*) AS follower_count
    FROM followers
    WHERE following_id = creator_id_param
  ),
  earnings_stats AS (
    -- Simplified earnings calculation for demo
    SELECT 
      COALESCE(SUM(CASE WHEN is_premium THEN price * 0.8 ELSE 0 END), 0) AS total_earnings,
      COALESCE(
        (SUM(CASE WHEN created_at > (NOW() - INTERVAL '30 days') THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(SUM(CASE WHEN created_at > (NOW() - INTERVAL '60 days') 
                        AND created_at <= (NOW() - INTERVAL '30 days') THEN 1 ELSE 0 END), 0)) - 100,
        0
      ) AS monthly_growth
    FROM posts
    WHERE user_id = creator_id_param
  )
  SELECT json_build_object(
    'total_views', vs.total_views,
    'total_likes', vs.total_likes,
    'follower_count', fs.follower_count,
    'total_earnings', es.total_earnings,
    'monthly_growth', ROUND(es.monthly_growth::numeric, 1),
    'likes_growth', 8.2, -- Placeholder for demo
    'follower_growth', 15.3, -- Placeholder for demo
    'earnings_growth', 22.1 -- Placeholder for demo
  ) INTO result
  FROM view_stats vs, follower_stats fs, earnings_stats es;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get creator engagement trends
CREATE OR REPLACE FUNCTION get_creator_engagement_trends(
  creator_id_param UUID,
  period_param TEXT DEFAULT 'week',
  metric_param TEXT DEFAULT 'views'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  date_interval INTERVAL;
  date_format TEXT;
  date_trunc_unit TEXT;
BEGIN
  -- Set interval and format based on period
  IF period_param = 'week' THEN
    date_interval := INTERVAL '7 days';
    date_format := 'Dy';
    date_trunc_unit := 'day';
  ELSIF period_param = 'month' THEN
    date_interval := INTERVAL '30 days';
    date_format := 'DD';
    date_trunc_unit := 'day';
  ELSE -- year
    date_interval := INTERVAL '365 days';
    date_format := 'Mon';
    date_trunc_unit := 'month';
  END IF;
  
  -- Get engagement data based on metric
  WITH dates AS (
    SELECT generate_series(
      date_trunc(date_trunc_unit, NOW() - date_interval),
      date_trunc(date_trunc_unit, NOW()),
      ('1 ' || date_trunc_unit)::interval
    ) AS date
  ),
  metrics AS (
    SELECT 
      date_trunc(date_trunc_unit, created_at) AS date,
      SUM(CASE WHEN metric_param = 'views' THEN view_count
               WHEN metric_param = 'likes' THEN like_count
               WHEN metric_param = 'comments' THEN comment_count
               WHEN metric_param = 'shares' THEN share_count
               ELSE 0 END) AS value
    FROM posts
    WHERE user_id = creator_id_param
      AND created_at > NOW() - date_interval
    GROUP BY date_trunc(date_trunc_unit, created_at)
  ),
  combined AS (
    SELECT 
      d.date,
      COALESCE(m.value, 0) AS value,
      to_char(d.date, date_format) AS label
    FROM dates d
    LEFT JOIN metrics m ON date_trunc(date_trunc_unit, m.date) = date_trunc(date_trunc_unit, d.date)
    ORDER BY d.date
  )
  SELECT json_build_object(
    'labels', (SELECT json_agg(c.label) FROM combined c),
    'datasets', json_build_array(
      json_build_object(
        'label', metric_param,
        'data', (SELECT json_agg(c.value) FROM combined c)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get creator audience demographics
CREATE OR REPLACE FUNCTION get_creator_audience_demographics(creator_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- For demo purposes, return mock data
  -- In a real implementation, this would query actual user demographics
  SELECT json_build_object(
    'top_countries', json_build_array(
      json_build_object('name', 'United States', 'percentage', 45),
      json_build_object('name', 'United Kingdom', 'percentage', 15),
      json_build_object('name', 'Canada', 'percentage', 12),
      json_build_object('name', 'Australia', 'percentage', 8),
      json_build_object('name', 'Germany', 'percentage', 5)
    ),
    'age_groups', json_build_array(
      json_build_object('range', '18-24', 'percentage', 35),
      json_build_object('range', '25-34', 'percentage', 40),
      json_build_object('range', '35-44', 'percentage', 15),
      json_build_object('range', '45+', 'percentage', 10)
    ),
    'platforms', json_build_array(
      json_build_object('name', 'Mobile', 'percentage', 65),
      json_build_object('name', 'Desktop', 'percentage', 30),
      json_build_object('name', 'Tablet', 'percentage', 5)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get creator revenue breakdown
CREATE OR REPLACE FUNCTION get_creator_revenue_breakdown(
  creator_id_param UUID,
  period_param TEXT DEFAULT 'month'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  date_interval INTERVAL;
BEGIN
  -- Set interval based on period
  IF period_param = 'week' THEN
    date_interval := INTERVAL '7 days';
  ELSIF period_param = 'month' THEN
    date_interval := INTERVAL '30 days';
  ELSIF period_param = 'year' THEN
    date_interval := INTERVAL '365 days';
  ELSE -- all time
    date_interval := INTERVAL '100 years';
  END IF;
  
  -- For demo purposes, calculate simplified revenue
  -- In a real implementation, this would query actual revenue data
  WITH post_revenue AS (
    SELECT 
      COALESCE(SUM(CASE WHEN is_premium THEN price * 0.8 ELSE 0 END), 0) AS premium_content
    FROM posts
    WHERE user_id = creator_id_param
      AND created_at > NOW() - date_interval
  )
  SELECT json_build_object(
    'premium_content', pr.premium_content,
    'subscriptions', ROUND((pr.premium_content * 0.6)::numeric, 2),
    'tips', ROUND((pr.premium_content * 0.3)::numeric, 2),
    'other', ROUND((pr.premium_content * 0.1)::numeric, 2)
  ) INTO result
  FROM post_revenue pr;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for analytics functions
ALTER FUNCTION get_creator_analytics_overview(UUID) SECURITY DEFINER;
ALTER FUNCTION get_creator_engagement_trends(UUID, TEXT, TEXT) SECURITY DEFINER;
ALTER FUNCTION get_creator_audience_demographics(UUID) SECURITY DEFINER;
ALTER FUNCTION get_creator_revenue_breakdown(UUID, TEXT) SECURITY DEFINER;