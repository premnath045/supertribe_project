import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiEye, FiHeart, FiMessageCircle, FiShare, FiDollarSign, FiRefreshCw } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useContentPerformance } from '../../hooks/useCreatorAnalytics'
import LoadingSpinner from '../UI/LoadingSpinner'

function ContentPerformance() {
  const [period, setPeriod] = useState('month')
  const [limit, setLimit] = useState(5)
  
  const { 
    data: posts, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useContentPerformance({
    period,
    limit
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
          <button 
            onClick={() => refetch()} 
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Try Again
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading content performance</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Content Performance</h3>
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

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {post.media_urls && post.media_urls.length > 0 ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={post.media_urls[0]}
                      alt="Post thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=100'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">No img</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {post.content ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '') : 'Untitled post'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    {post.is_premium && (
                      <span className="ml-2 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-xs">
                        Premium ${post.price}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <FiEye className="text-blue-500" />
                  <span>{post.view_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiHeart className="text-red-500" />
                  <span>{post.like_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiMessageCircle className="text-green-500" />
                  <span>{post.comment_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiDollarSign className="text-yellow-500" />
                  <span>${post.earnings}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts found for this period</p>
          </div>
        )}
      </div>

      {posts && posts.length > 0 && posts.length < limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setLimit(limit + 5)}
            className="text-primary-500 hover:text-primary-600 font-medium text-sm"
          >
            Show More
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default ContentPerformance