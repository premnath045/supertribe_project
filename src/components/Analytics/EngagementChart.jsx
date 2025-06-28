import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiRefreshCw } from 'react-icons/fi'
import { useEngagementTrends } from '../../hooks/useCreatorAnalytics'
import LoadingSpinner from '../UI/LoadingSpinner'

function EngagementChart() {
  const [period, setPeriod] = useState('week')
  const [metric, setMetric] = useState('views')
  
  const { 
    data: engagementData, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useEngagementTrends({
    period,
    metric
  })

  // Render chart using the data
  // For this implementation, we'll use a simplified bar chart representation
  // In a real app, you would use a charting library like Chart.js or Recharts
  
  const renderBarChart = () => {
    if (!engagementData || !engagementData.datasets || !engagementData.labels) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )
    }
    
    const dataset = engagementData.datasets[0]
    const maxValue = Math.max(...dataset.data, 1) // Ensure non-zero for division
    
    return (
      <div className="h-64 flex items-end space-x-2">
        {dataset.data.map((value, index) => {
          const height = `${Math.max((value / maxValue) * 100, 5)}%`
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full relative group">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height }}
                  className="w-full bg-primary-500 rounded-t-md"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {value} {metric}
                  </div>
                </motion.div>
              </div>
              <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                {engagementData.labels[index]}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
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
          <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
          <button 
            onClick={() => refetch()} 
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Try Again
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading engagement data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
        <div className="flex items-center space-x-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
            <option value="shares">Shares</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
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

      {renderBarChart()}
    </motion.div>
  )
}

export default EngagementChart