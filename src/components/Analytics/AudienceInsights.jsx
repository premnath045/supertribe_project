import { motion } from 'framer-motion'
import { FiRefreshCw, FiGlobe, FiUsers, FiMonitor } from 'react-icons/fi'
import { useAudienceDemographics } from '../../hooks/useCreatorAnalytics'
import LoadingSpinner from '../UI/LoadingSpinner'

function AudienceInsights() {
  const { 
    data: audience, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useAudienceDemographics()

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
          <h3 className="text-lg font-semibold text-gray-900">Audience Insights</h3>
          <button 
            onClick={() => refetch()} 
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Try Again
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading audience data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  // If no audience data or empty arrays
  const hasNoData = !audience || 
    ((!audience.top_countries || audience.top_countries.length === 0) &&
     (!audience.age_groups || audience.age_groups.length === 0) &&
     (!audience.platforms || audience.platforms.length === 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Audience Insights</h3>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors rounded-lg hover:bg-gray-100"
        >
          <FiRefreshCw className={`text-lg ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {hasNoData ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No audience data available yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Data will appear as your audience grows
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Countries */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FiGlobe className="text-blue-500" />
              <h4 className="font-medium text-gray-900">Top Countries</h4>
            </div>
            
            {audience?.top_countries && audience.top_countries.length > 0 ? (
              <div className="space-y-3">
                {audience.top_countries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{country.name}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{country.percentage}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4">No country data</p>
            )}
          </div>
          
          {/* Age Groups */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FiUsers className="text-purple-500" />
              <h4 className="font-medium text-gray-900">Age Demographics</h4>
            </div>
            
            {audience?.age_groups && audience.age_groups.length > 0 ? (
              <div className="space-y-3">
                {audience.age_groups.map((age, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{age.range}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{age.percentage}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${age.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4">No age data</p>
            )}
          </div>
          
          {/* Platforms */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FiMonitor className="text-green-500" />
              <h4 className="font-medium text-gray-900">Platforms</h4>
            </div>
            
            {audience?.platforms && audience.platforms.length > 0 ? (
              <div className="space-y-3">
                {audience.platforms.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{platform.name}</span>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{platform.percentage}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${platform.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4">No platform data</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default AudienceInsights