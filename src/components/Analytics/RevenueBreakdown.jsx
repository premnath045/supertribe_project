import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiRefreshCw, FiDollarSign } from 'react-icons/fi'
import { useRevenueBreakdown } from '../../hooks/useCreatorAnalytics'
import LoadingSpinner from '../UI/LoadingSpinner'

function RevenueBreakdown() {
  const [period, setPeriod] = useState('month')
  
  const { 
    data: revenue, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useRevenueBreakdown({
    period
  })

  // Calculate total revenue
  const totalRevenue = revenue ? 
    revenue.premium_content + revenue.subscriptions + revenue.tips + revenue.other : 0

  // Calculate percentages for pie chart
  const getPercentage = (value) => {
    if (!totalRevenue) return 0
    return Math.round((value / totalRevenue) * 100)
  }

  // Render pie chart segments
  const renderPieChart = () => {
    if (!revenue || totalRevenue === 0) {
      return (
        <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
          <p className="text-gray-500 text-sm">No revenue data</p>
        </div>
      )
    }
    
    // For a real implementation, use a proper chart library
    // This is a simplified visual representation
    return (
      <div className="w-40 h-40 rounded-full overflow-hidden relative mx-auto">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Simplified pie chart segments */}
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Premium Content */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#ec4899"
            strokeWidth="10"
            strokeDasharray={`${getPercentage(revenue.premium_content) * 2.83} 283`}
            strokeDashoffset="0"
          />
          
          {/* Subscriptions */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#8b5cf6"
            strokeWidth="10"
            strokeDasharray={`${getPercentage(revenue.subscriptions) * 2.83} 283`}
            strokeDashoffset={`${-getPercentage(revenue.premium_content) * 2.83}`}
          />
          
          {/* Tips */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="10"
            strokeDasharray={`${getPercentage(revenue.tips) * 2.83} 283`}
            strokeDashoffset={`${-(getPercentage(revenue.premium_content) + getPercentage(revenue.subscriptions)) * 2.83}`}
          />
          
          {/* Other */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeDasharray={`${getPercentage(revenue.other) * 2.83} 283`}
            strokeDashoffset={`${-(getPercentage(revenue.premium_content) + getPercentage(revenue.subscriptions) + getPercentage(revenue.tips)) * 2.83}`}
          />
        </svg>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6 animate-pulse"></div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
          <button 
            onClick={() => refetch()} 
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Try Again
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading revenue data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors rounded-lg hover:bg-gray-100"
          >
            <FiRefreshCw className={`text-lg ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between">
        {/* Pie Chart */}
        <div className="mb-6 md:mb-0">
          {renderPieChart()}
        </div>
        
        {/* Legend and Details */}
        <div className="space-y-4 flex-1 md:ml-6">
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-pink-500 rounded-sm mr-2"></div>
              <span className="text-gray-900">Premium Content</span>
            </div>
            <div className="flex items-center">
              <FiDollarSign className="text-pink-500" />
              <span className="font-medium">{revenue?.premium_content?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded-sm mr-2"></div>
              <span className="text-gray-900">Subscriptions</span>
            </div>
            <div className="flex items-center">
              <FiDollarSign className="text-purple-500" />
              <span className="font-medium">{revenue?.subscriptions?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
              <span className="text-gray-900">Tips</span>
            </div>
            <div className="flex items-center">
              <FiDollarSign className="text-green-500" />
              <span className="font-medium">{revenue?.tips?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm mr-2"></div>
              <span className="text-gray-900">Other</span>
            </div>
            <div className="flex items-center">
              <FiDollarSign className="text-yellow-500" />
              <span className="font-medium">{revenue?.other?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RevenueBreakdown