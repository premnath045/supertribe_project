import { supabase } from './supabase'

/**
 * Fetches creator analytics overview data
 * @param {string} creatorId - The creator's user ID
 * @returns {Promise<Object>} Analytics overview data
 */
export const getCreatorAnalyticsOverview = async (creatorId) => {
  try {
    if (!creatorId) throw new Error('Creator ID is required')
    
    // Call the RPC function to get analytics overview
    const { data, error } = await supabase.rpc('get_creator_analytics_overview', {
      creator_id_param: creatorId
    })
    
    if (error) throw error
    
    return data || {
      total_views: 0,
      total_likes: 0,
      follower_count: 0,
      total_earnings: 0,
      monthly_growth: 0
    }
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    throw error
  }
}

/**
 * Fetches creator content performance data
 * @param {string} creatorId - The creator's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Content performance data
 */
export const getContentPerformance = async (creatorId, options = {}) => {
  try {
    if (!creatorId) throw new Error('Creator ID is required')
    
    const { limit = 10, period = 'month' } = options
    
    // Get content performance data
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        media_urls,
        is_premium,
        price,
        like_count,
        comment_count,
        share_count,
        view_count,
        created_at
      `)
      .eq('user_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    // Calculate earnings for each post (simplified for demo)
    const postsWithEarnings = (data || []).map(post => {
      // Simple earnings calculation based on views and premium status
      const baseEarnings = post.is_premium 
        ? (post.view_count * 0.05) + (post.price || 0) * Math.floor(post.view_count * 0.02)
        : post.view_count * 0.01
        
      return {
        ...post,
        earnings: parseFloat(baseEarnings.toFixed(2))
      }
    })
    
    return postsWithEarnings
  } catch (error) {
    console.error('Error fetching content performance:', error)
    throw error
  }
}

/**
 * Fetches creator engagement trends over time
 * @param {string} creatorId - The creator's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Engagement trend data
 */
export const getEngagementTrends = async (creatorId, options = {}) => {
  try {
    if (!creatorId) throw new Error('Creator ID is required')
    
    const { period = 'week', metric = 'views' } = options
    
    // Call the RPC function to get engagement trends
    const { data, error } = await supabase.rpc('get_creator_engagement_trends', {
      creator_id_param: creatorId,
      period_param: period,
      metric_param: metric
    })
    
    if (error) throw error
    
    // If no data, return empty dataset with default structure
    if (!data) {
      return {
        labels: [],
        datasets: []
      }
    }
    
    return data
  } catch (error) {
    console.error('Error fetching engagement trends:', error)
    throw error
  }
}

/**
 * Fetches creator audience demographics
 * @param {string} creatorId - The creator's user ID
 * @returns {Promise<Object>} Audience demographics data
 */
export const getAudienceDemographics = async (creatorId) => {
  try {
    if (!creatorId) throw new Error('Creator ID is required')
    
    // Call the RPC function to get audience demographics
    const { data, error } = await supabase.rpc('get_creator_audience_demographics', {
      creator_id_param: creatorId
    })
    
    if (error) throw error
    
    return data || {
      top_countries: [],
      age_groups: [],
      platforms: []
    }
  } catch (error) {
    console.error('Error fetching audience demographics:', error)
    throw error
  }
}

/**
 * Fetches creator revenue breakdown
 * @param {string} creatorId - The creator's user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Revenue breakdown data
 */
export const getRevenueBreakdown = async (creatorId, options = {}) => {
  try {
    if (!creatorId) throw new Error('Creator ID is required')
    
    const { period = 'month' } = options
    
    // Call the RPC function to get revenue breakdown
    const { data, error } = await supabase.rpc('get_creator_revenue_breakdown', {
      creator_id_param: creatorId,
      period_param: period
    })
    
    if (error) throw error
    
    return data || {
      premium_content: 0,
      subscriptions: 0,
      tips: 0,
      other: 0
    }
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error)
    throw error
  }
}