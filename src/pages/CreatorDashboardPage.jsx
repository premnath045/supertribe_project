import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft,
  FiPlus,
  FiRefreshCw
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useRefreshAnalytics } from '../hooks/useCreatorAnalytics'

// Import analytics components
import AnalyticsOverview from '../components/Analytics/AnalyticsOverview'
import ContentPerformance from '../components/Analytics/ContentPerformance'
import EngagementChart from '../components/Analytics/EngagementChart'
import RevenueBreakdown from '../components/Analytics/RevenueBreakdown'
import AudienceInsights from '../components/Analytics/AudienceInsights'

function CreatorDashboardPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const { refreshAll } = useRefreshAnalytics()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Handle refresh all analytics data
  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    await refreshAll()
    setTimeout(() => setIsRefreshing(false), 500) // Visual feedback
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          
          <h1 className="text-lg font-semibold">Creator Dashboard</h1>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors rounded-lg hover:bg-gray-100"
            >
              <FiRefreshCw className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <button
              onClick={() => navigate('/create')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <FiPlus className="text-lg" />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-8"
        >
          <div className="flex items-center space-x-4">
            <img
              src={userProfile?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100'}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
            />
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {userProfile?.display_name || 'Creator'}!
              </h2>
              <p className="opacity-90">
                Ready to create amazing content today?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <AnalyticsOverview />

        {/* Content Performance */}
        <ContentPerformance />
        
        {/* Engagement Chart */}
        <EngagementChart />
        
        {/* Revenue Breakdown */}
        <RevenueBreakdown />
        
        {/* Audience Insights */}
        <AudienceInsights />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <button
            onClick={() => navigate('/create')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <FiPlus className="text-xl text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create New Post</h3>
            <p className="text-sm text-gray-600">Share your latest content with followers</p>
          </button>

          <button className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiRefreshCw className="text-xl text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Refresh Analytics</h3>
            <p className="text-sm text-gray-600">Update all analytics data</p>
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default CreatorDashboardPage