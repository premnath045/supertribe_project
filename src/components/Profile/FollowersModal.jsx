import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSearch } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import FollowersListItem from './FollowersListItem'
import LoadingSpinner from '../UI/LoadingSpinner'

function FollowersModal({ isOpen, onClose, profileId, initialTab = 'followers', followerCount, followingCount }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [followStatus, setFollowStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setSearchQuery('')
      fetchUsers()
      
      // Focus search input after a short delay
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 300)
    }
  }, [isOpen, initialTab, profileId])

  // Fetch followers and following
  const fetchUsers = async () => {
    if (!profileId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch followers
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles!follower_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('following_id', profileId)
      
      if (followersError) throw followersError
      
      // Fetch following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles!following_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('follower_id', profileId)
      
      if (followingError) throw followingError
      
      // Process followers
      const processedFollowers = followersData
        .map(item => item.profiles)
        .filter(profile => profile)
      
      // Process following
      const processedFollowing = followingData
        .map(item => item.profiles)
        .filter(profile => profile)
      
      setFollowers(processedFollowers)
      setFollowing(processedFollowing)
      
      // Check follow status for current user
      if (user) {
        await checkFollowStatus([...processedFollowers, ...processedFollowing])
      }
      
    } catch (err) {
      console.error('Error fetching followers/following:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  
  // Check if current user follows each user in the list
  const checkFollowStatus = async (userList) => {
    if (!user || !userList.length) return
    
    try {
      const userIds = userList.map(u => u.id)
      
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds)
      
      if (error) throw error
      
      const followingIds = data.map(item => item.following_id)
      const statusMap = {}
      
      userList.forEach(u => {
        statusMap[u.id] = followingIds.includes(u.id)
      })
      
      setFollowStatus(statusMap)
      
    } catch (err) {
      console.error('Error checking follow status:', err)
    }
  }
  
  // Handle follow/unfollow
  const handleToggleFollow = async (userId) => {
    if (!user) return
    
    try {
      const currentStatus = followStatus[userId] || false
      
      // Optimistically update UI
      setFollowStatus(prev => ({
        ...prev,
        [userId]: !currentStatus
      }))
      
      if (currentStatus) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          })
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      // Revert UI on error
      setFollowStatus(prev => ({
        ...prev,
        [userId]: !prev[userId]
      }))
    }
  }
  
  // Filter users based on search query
  const filterUsers = (users) => {
    if (!searchQuery.trim()) return users
    
    const query = searchQuery.toLowerCase()
    return users.filter(user => {
      return (
        (user.username && user.username.toLowerCase().includes(query)) ||
        (user.display_name && user.display_name.toLowerCase().includes(query))
      )
    })
  }
  
  const filteredFollowers = filterUsers(followers)
  const filteredFollowing = filterUsers(following)
  
  // Get active list
  const activeList = activeTab === 'followers' ? filteredFollowers : filteredFollowing

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md bg-white rounded-xl overflow-hidden h-[80vh] flex flex-col shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 pt-4 pb-3">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`flex-1 py-2.5 font-semibold transition-colors text-center ${
                    activeTab === 'followers'
                      ? 'text-gray-900 border-b-2 border-black'
                      : 'text-gray-500'
                  }`}
                >
                  Followers {followerCount !== undefined ? `(${followerCount})` : ''}
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 py-2.5 font-semibold transition-colors text-center ${
                    activeTab === 'following'
                      ? 'text-gray-900 border-b-2 border-black'
                      : 'text-gray-500'
                  }`}
                >
                  Following {followingCount !== undefined ? `(${followingCount})` : ''}
                </button>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-4 p-2 text-gray-600 hover:text-gray-900 rounded-full"
              >
                <FiX className="text-xl" />
              </button>
              
              {/* Search bar */}
              <div className="px-4 pt-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* List content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <LoadingSpinner size="md" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  {error}
                </div>
              ) : activeList.length > 0 ? (
                <div>
                  {activeList.map(userItem => (
                    <FollowersListItem
                      key={userItem.id}
                      user={userItem}
                      isFollowing={followStatus[userItem.id] || false}
                      onToggleFollow={handleToggleFollow}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">
                    {activeTab === 'followers'
                      ? 'No followers found'
                      : 'Not following anyone'}
                    {searchQuery && ' matching your search'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FollowersModal