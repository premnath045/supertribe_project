import { motion } from 'framer-motion'
import { FiTrendingUp, FiEye, FiHeart, FiUsers, FiDollarSign } from 'react-icons/fi'
import { useAnalyticsOverview } from '../../hooks/useCreatorAnalytics'
import LoadingSpinner from '../UI/LoadingSpinner'

function AnalyticsOverview() {
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useAnalyticsOverview()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm">{error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.total_views?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FiEye className="text-xl text-blue-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <FiTrendingUp className="text-green-500 mr-1" />
          <span className="text-green-500 font-medium">+{stats?.monthly_growth || 0}%</span>
          <span className="text-gray-500 ml-1">this month</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Likes</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.total_likes?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FiHeart className="text-xl text-red-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <FiTrendingUp className="text-green-500 mr-1" />
          <span className="text-green-500 font-medium">+{stats?.likes_growth || 8.2}%</span>
          <span className="text-gray-500 ml-1">this month</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Followers</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.follower_count?.toLocaleString() || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <FiUsers className="text-xl text-purple-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <FiTrendingUp className="text-green-500 mr-1" />
          <span className="text-green-500 font-medium">+{stats?.follower_growth || 15.3}%</span>
          <span className="text-gray-500 ml-1">this month</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Earnings</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats?.total_earnings?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-xl text-green-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <FiTrendingUp className="text-green-500 mr-1" />
          <span className="text-green-500 font-medium">+{stats?.earnings_growth || 22.1}%</span>
          <span className="text-gray-500 ml-1">this month</span>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsOverview