import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiBarChart2, FiClock, FiInfo } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import usePollVotes from '../../hooks/usePollVotes'

function PollDisplay({ post, onVote, compact = false }) {
  const { user } = useAuth()
  const { 
    userVote, 
    voteCount, 
    totalVotes, 
    percentages, 
    loading, 
    submitting, 
    submitVote 
  } = usePollVotes(post.id)
  
  const [localUserVote, setLocalUserVote] = useState(null)
  
  // Initialize with any existing vote
  useEffect(() => {
    if (userVote !== null) {
      setLocalUserVote(userVote)
    }
  }, [userVote])
  
  // Handle vote
  const handleVote = async (optionIndex) => {
    if (!user || submitting || localUserVote !== null) return
    
    // Optimistic UI update
    setLocalUserVote(optionIndex)
    
    // Submit vote to database
    const success = await submitVote(optionIndex)
    
    // Call parent component callback
    if (success && onVote) {
      onVote(post.id, optionIndex)
    }
    
    // If failed, reset local state
    if (!success) {
      setLocalUserVote(null)
    }
  }
  
  if (!post.poll) return null
  
  return (
    <div className={compact ? "mt-2" : "mt-3 mb-4"}>
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">{post.poll.question}</h4>
        <div className="space-y-2">
          {post.poll.options.map((option, index) => {
            // Calculate percentage
            const optionVotes = voteCount[index] || 0
            const percentage = percentages[index] || 0
            const isSelected = localUserVote === index
            
            return (
              <div key={index} className="relative">
                <button 
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-primary-50 border-primary-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handleVote(index)}
                  disabled={loading || submitting || localUserVote !== null || !user}
                >
                  <div className="flex justify-between items-center">
                    <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${
                      isSelected ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Poll metadata */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center">
            <FiBarChart2 className="mr-1" />
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <FiClock className="mr-1" />
            <span>
              {post.poll.duration === 1 
                ? '1 day remaining' 
                : `${post.poll.duration} days remaining`}
            </span>
          </div>
        </div>
        
        {!user && !compact && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <FiInfo className="mr-1 text-primary-500" />
            <span>Sign in to vote in this poll</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PollDisplay