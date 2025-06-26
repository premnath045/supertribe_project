import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useFollow } from '../hooks/useFollow'
import LoadingSpinner from '../components/UI/LoadingSpinner'

// Import Profile components
import ProfileHeader from '../components/Profile/Header/ProfileHeader'
import StoryHighlights from '../components/Profile/Stories/StoryHighlights'
import Bio from '../components/Profile/Bio'
import ViewProfileActions from '../components/Profile/Actions/ViewProfileActions'
import ProfileTabView from '../components/Profile/Content/ProfileTabView'
import FollowersModal from '../components/Profile/FollowersModal'

// Import hook for story highlights
import useStoryHighlights from '../hooks/useStoryHighlights'

function ProfileView() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State
  const [profileData, setProfileData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersModalTab, setFollowersModalTab] = useState('followers')
  
  // Get story highlights data (view-only)
  const { 
    highlights, 
    loading: highlightsLoading, 
    error: highlightsError
  } = useStoryHighlights(profileData?.id)

  // Use follow hook
  const {
    isFollowing,
    followerCount,
    followingCount,
    loading: followLoading,
    actionLoading: followActionLoading,
    toggleFollow,
    error: followError
  } = useFollow(profileData?.id)

  // Combined stats object
  const profileStats = {
    postCount: userPosts?.length || 0,
    followerCount,
    followingCount
  }

  // Fetch profile data
  useEffect(() => {
    if (username) {
      fetchProfileData()
    }
  }, [username])

  // Fetch posts when profile data is loaded
  useEffect(() => {
    if (profileData) {
      fetchUserPosts()
    }
  }, [profileData])
  
  // Fetch profile data from Supabase
  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null) 

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('Profile not found')
        } else {
          setError('Failed to load profile')
        }
        console.error('Error fetching profile:', profileError)
        return
      }
      
      // Check if this is our own profile
      if (user && profile.id === user.id) {
        navigate(`/profile/${profile.username}`)
        return
      }

      setProfileData(profile)

    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch user content
  const fetchUserPosts = async () => {
    setPostsLoading(true)
    
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('user_id', profileData.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        
      if (postsError) throw postsError
      setUserPosts(postsData || [])
      
    } catch (err) {
      console.error('Error fetching user content:', err)
      // Don't set error state here to avoid blocking the UI
    } finally {
      setPostsLoading(false)
    }
  }
  
  // Toggle follow status
  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    await toggleFollow()
  }
  
  // Handlers for follower/following modal
  const handleOpenFollowers = () => {
    setFollowersModalTab('followers')
    setShowFollowersModal(true)
  }

  const handleOpenFollowing = () => {
    setFollowersModalTab('following')
    setShowFollowersModal(true)
  }
  
  // Handle view highlight
  const handleViewHighlight = (highlight) => {
    // Here you would show a story viewer modal with the highlight stories
    console.log('View highlight:', highlight)
    // For now, just a placeholder
    alert(`Viewing highlight: ${highlight.title}`)
  }
  
  // Handle sending message
  const handleSendMessage = async () => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    try {
      // Navigate to messages page
      navigate('/messages')
      
      // You would typically pass the profile ID or some context to the messages page
      // For now, this just navigates
    } catch (error) {
      console.error('Error navigating to messages:', error)
    }
  }

  // Loading state
  if (loading || followLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error || followError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || followError}
          </h1>
          <p className="text-gray-600 mb-6">
            The profile you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // No profile data
  if (!profileData) {
    return null
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Back button header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="ml-4 font-semibold">@{profileData.username}</h1>
        </div>
      </div>
    
      <div className="max-w-lg mx-auto">
        {/* Profile Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6 pb-0">
            {/* Profile Header and Stats */}
            <ProfileHeader 
              profileData={profileData}
              isOwnProfile={false}
              isEditing={false}
              stats={profileStats}
              onOpenFollowers={handleOpenFollowers}
              onOpenFollowing={handleOpenFollowing}
            />
            
            {/* Bio */}
            <Bio bio={profileData.bio} />
            
            {/* Profile Actions (Follow, Message) */}
            <ViewProfileActions
              profileData={profileData}
              isFollowing={isFollowing}
              isLoading={followActionLoading}
              onToggleFollow={handleToggleFollow}
              onSendMessage={handleSendMessage}
            />
            
            {/* Story Highlights */}
            {highlights && highlights.length > 0 && (
              <StoryHighlights 
                highlights={highlights} 
                isEditable={false}
                onViewHighlight={handleViewHighlight}
              />
            )}
            
          </div>
        </div>
        
        {/* Tabbed Content View */}
        <ProfileTabView
          profileData={profileData}
          userPosts={userPosts}
          loading={postsLoading}
          error={null}
          navigate={navigate}
        />
      </div>
    </motion.div>
    
    {/* Followers/Following Modal */}
    <FollowersModal
      isOpen={showFollowersModal}
      onClose={() => setShowFollowersModal(false)}
      profileId={profileData?.id}
      initialTab={followersModalTab}
      followerCount={followerCount}
      followingCount={followingCount}
    />
  </>
  )
}


export default ProfileView