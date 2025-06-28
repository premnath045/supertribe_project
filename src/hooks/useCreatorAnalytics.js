import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { 
  getCreatorAnalyticsOverview,
  getContentPerformance,
  getEngagementTrends,
  getAudienceDemographics,
  getRevenueBreakdown
} from '../lib/analytics'

// Query keys for analytics data
export const analyticsKeys = {
  all: ['analytics'],
  overview: (creatorId) => ['analytics', 'overview', creatorId],
  contentPerformance: (creatorId) => ['analytics', 'content', creatorId],
  engagementTrends: (creatorId, period) => ['analytics', 'engagement', creatorId, period],
  audienceDemographics: (creatorId) => ['analytics', 'audience', creatorId],
  revenueBreakdown: (creatorId, period) => ['analytics', 'revenue', creatorId, period]
}

/**
 * Hook for fetching creator analytics overview
 */
export const useAnalyticsOverview = (options = {}) => {
  const { user } = useAuth()
  const creatorId = options.creatorId || user?.id
  
  const { 
    enabled = !!creatorId,
    refetchInterval = 300000, // 5 minutes
    ...queryOptions 
  } = options
  
  return useQuery({
    queryKey: analyticsKeys.overview(creatorId),
    queryFn: () => getCreatorAnalyticsOverview(creatorId),
    enabled,
    refetchInterval,
    ...queryOptions
  })
}

/**
 * Hook for fetching content performance data
 */
export const useContentPerformance = (options = {}) => {
  const { user } = useAuth()
  const creatorId = options.creatorId || user?.id
  
  const { 
    limit = 10,
    period = 'month',
    enabled = !!creatorId,
    ...queryOptions 
  } = options
  
  return useQuery({
    queryKey: [...analyticsKeys.contentPerformance(creatorId), { limit, period }],
    queryFn: () => getContentPerformance(creatorId, { limit, period }),
    enabled,
    ...queryOptions
  })
}

/**
 * Hook for fetching engagement trends
 */
export const useEngagementTrends = (options = {}) => {
  const { user } = useAuth()
  const creatorId = options.creatorId || user?.id
  
  const { 
    period = 'week',
    metric = 'views',
    enabled = !!creatorId,
    ...queryOptions 
  } = options
  
  return useQuery({
    queryKey: [...analyticsKeys.engagementTrends(creatorId, period), { metric }],
    queryFn: () => getEngagementTrends(creatorId, { period, metric }),
    enabled,
    ...queryOptions
  })
}

/**
 * Hook for fetching audience demographics
 */
export const useAudienceDemographics = (options = {}) => {
  const { user } = useAuth()
  const creatorId = options.creatorId || user?.id
  
  const { 
    enabled = !!creatorId,
    ...queryOptions 
  } = options
  
  return useQuery({
    queryKey: analyticsKeys.audienceDemographics(creatorId),
    queryFn: () => getAudienceDemographics(creatorId),
    enabled,
    ...queryOptions
  })
}

/**
 * Hook for fetching revenue breakdown
 */
export const useRevenueBreakdown = (options = {}) => {
  const { user } = useAuth()
  const creatorId = options.creatorId || user?.id
  
  const { 
    period = 'month',
    enabled = !!creatorId,
    ...queryOptions 
  } = options
  
  return useQuery({
    queryKey: [...analyticsKeys.revenueBreakdown(creatorId, period)],
    queryFn: () => getRevenueBreakdown(creatorId, { period }),
    enabled,
    ...queryOptions
  })
}

/**
 * Hook for refreshing all analytics data
 */
export const useRefreshAnalytics = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const refreshAll = () => {
    if (!user?.id) return
    
    queryClient.invalidateQueries({ queryKey: analyticsKeys.overview(user.id) })
    queryClient.invalidateQueries({ queryKey: analyticsKeys.contentPerformance(user.id) })
    queryClient.invalidateQueries({ queryKey: analyticsKeys.engagementTrends(user.id) })
    queryClient.invalidateQueries({ queryKey: analyticsKeys.audienceDemographics(user.id) })
    queryClient.invalidateQueries({ queryKey: analyticsKeys.revenueBreakdown(user.id) })
  }
  
  return { refreshAll }
}