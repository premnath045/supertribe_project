import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFollow } from '../hooks/useFollow'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { validateUsername } from '../utils/validation'

// Import Profile components
import ProfileHeader from '../components/Profile/Header/ProfileHeader'
import StoryHighlights from '../components/Profile/Stories/StoryHighlights'
import StoryHighlightModal from '../components/Profile/Stories/StoryHighlightModal'
import Bio from '../components/Profile/Bio'
import ContentTabs from '../components/Profile/Content/ContentTabs'
import ContentGrid from '../components/Profile/Content/ContentGrid'
import ProfileActions from '../components/Profile/Actions/ProfileActions'
import FollowersModal from '../components/Profile/FollowersModal'

// Import hook for story highlights
import useStoryHighlights from '../hooks/useStoryHighlights'

function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, userProfile, updateUserProfile } = useAuth()
  
  // State
  const [profileData, setProfileData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersModalTab, setFollowersModalTab] = useState('followers')
  
  // Story highlights state
  const [showHighlightModal, setShowHighlightModal] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  })
  const [editErrors, setEditErrors] = useState({})

  // Check if this profile belongs to the current user
  const isOwnProfile = user && profileData && user.id === profileData.id

  // Use follow hook for current profile - always use profileData?.id
  const {
    isFollowing,
    followerCount,
    followingCount,
    loading: followLoading,
    toggleFollow
  } = useFollow(profileData?.id)

  // Combined stats object
  const profileStats = {
    postCount: userPosts?.length || 0,
    followerCount,
    followingCount
  }

  // Get story highlights data
  const { 
    highlights, 
    userStories, 
    loading: highlightsLoading, 
    error: highlightsError,
    saving: savingHighlights,
    createHighlight
  } = useStoryHighlights(profileData?.id)

  // Fetch profile data
  useEffect(() => {
    if (username) {
      fetchProfileData()
    }
  }, [username])

  // Fetch posts when profile data is loaded
  useEffect(() => {
    if (profileData) {
      fetchUserContent()
    }
  }, [profileData, activeTab])

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

      setProfileData(profile)
      
      // Initialize edit form with current data 
      setEditForm({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user content (posts, saved, liked)
  const fetchUserContent = async () => {
    setContentLoading(true)
    
    try {
      // Only fetch posts for the active tab to optimize performance
      if (activeTab === 'posts') {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          
        if (postsError) throw postsError
        setUserPosts(postsData || [])
        
        // Update post count in stats
        setProfileStats(prev => ({ 
          ...prev, 
          postCount: postsData?.length || 0 
        }))
      }
      
      if (activeTab === 'saved' && isOwnProfile) {
        const { data: savesData, error: savesError } = await supabase
          .from('post_saves')
          .select('post_id, posts:post_id(*)')
          .eq('user_id', profileData.id)
          
        if (savesError) throw savesError
        setSavedPosts((savesData || []).map(s => s.posts).filter(Boolean))
      }
      
      if (activeTab === 'liked' && isOwnProfile) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id, posts:post_id(*)')
          .eq('user_id', profileData.id)
          
        if (likesError) throw likesError
        setLikedPosts((likesData || []).map(l => l.posts).filter(Boolean))
      }
    } catch (err) {
      console.error('Error fetching user content:', err)
      // Don't set error state here to avoid blocking the UI
    } finally {
      setContentLoading(false)
    }
  }

  // Validate edit form
  const validateEditForm = () => {
    const errors = {}

    // Username validation
    if (!editForm.username.trim()) {
      errors.username = 'Username is required'
    } else if (!validateUsername(editForm.username)) {
      errors.username = 'Username must be 3-20 characters, letters, numbers, and underscores only'
    }

    // Display name validation
    if (!editForm.display_name.trim()) {
      errors.display_name = 'Display name is required'
    } else if (editForm.display_name.length < 2) {
      errors.display_name = 'Display name must be at least 2 characters'
    }

    // Bio validation
    if (editForm.bio && editForm.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }

    // Avatar URL validation (basic)
    if (editForm.avatar_url && editForm.avatar_url.trim()) {
      try {
        new URL(editForm.avatar_url)
        // Basic image URL validation
        if (!editForm.avatar_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          errors.avatar_url = 'Avatar URL must be a valid image URL'
        }
      } catch {
        errors.avatar_url = 'Please enter a valid URL'
      }
    }

    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input changes in edit form
  const handleEditInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateEditForm()) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Check if username is already taken (if changed)
      if (editForm.username !== profileData.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editForm.username)
          .single()

        if (existingUser) {
          setEditErrors({ username: 'Username is already taken' })
          setSaving(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          display_name: editForm.display_name,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        setError('Failed to update profile')
        return
      }

      // Update local state
      setProfileData(data)
      setIsEditing(false)

      // Update auth context if this is the current user's profile
      if (isOwnProfile) {
        await updateUserProfile({
          username: data.username,
          display_name: data.display_name,
          bio: data.bio,
          avatar_url: data.avatar_url
        })
      }

    } catch (error) {
      console.error('Error updating profile:', error)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditErrors({})
    // Reset form to original data
    setEditForm({
      username: profileData.username || '',
      display_name: profileData.display_name || '',
      bio: profileData.bio || '',
      avatar_url: profileData.avatar_url || ''
    })
  }
  
  // Handle adding a new highlight
  const handleAddHighlight = () => {
    setShowHighlightModal(true)
  }
  
  // Handle saving a highlight
  const handleSaveHighlight = async (highlightData) => {
    try {
      await createHighlight(highlightData)
      setShowHighlightModal(false)
    } catch (error) {
      console.error('Failed to create highlight:', error)
      // You could show an error message here
    }
  }
  
  // Handle viewing a highlight
  const handleViewHighlight = (highlight) => {
    // Here you would show a story viewer modal with the highlight stories
    console.log('View highlight:', highlight)
    // For now, just a placeholder
    alert(`Viewing highlight: ${highlight.title}`)
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

  // Loading state
  if (loading || (followLoading && !isOwnProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error && !isOwnProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error}
          </h1>
          <p className="text-gray-600 mb-6">
            The profile you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => window.history.back()}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-lg mx-auto">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mx-4 mt-4"
          >
            {error}
          </motion.div>
        )}

        {/* Profile Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="p-6">
            {/* Profile Header and Stats */}
            <ProfileHeader 
              profileData={profileData}
              isOwnProfile={isOwnProfile}
              isEditing={isEditing}
              editForm={editForm}
              editErrors={editErrors}
              handleEditInputChange={handleEditInputChange}
              stats={profileStats}
              onOpenFollowers={handleOpenFollowers}
              onOpenFollowing={handleOpenFollowing}
            />
            
            {/* Bio */}
            {!isEditing && <Bio bio={profileData.bio} />}
            
            {/* Profile Actions */}
            <ProfileActions 
              isOwnProfile={isOwnProfile}
              isEditing={isEditing}
              isFollowing={isFollowing}
              onToggleFollow={toggleFollow}
              setIsEditing={setIsEditing}
              handleSaveProfile={handleSaveProfile}
              handleCancelEdit={handleCancelEdit}
              saving={saving}
            />
            
            {/* Edit Form */}
            {isEditing && (
              <div className="space-y-6 mb-8">
                {/* Profile Information Section */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => handleEditInputChange('username', e.target.value.toLowerCase())}
                        className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                          editErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        placeholder="username"
                      />
                    </div>
                    {editErrors.username && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.username}</p>
                    )}
                  </div>

                  {/* Display Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => handleEditInputChange('display_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        editErrors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Your display name"
                    />
                    {editErrors.display_name && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.display_name}</p>
                    )}
                  </div>

                  {/* Bio Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleEditInputChange('bio', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none ${
                        editErrors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Tell people about yourself..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      {editErrors.bio ? (
                        <p className="text-red-500 text-xs">{editErrors.bio}</p>
                      ) : (
                        <div></div>
                      )}
                      <p className={`text-xs ${editForm.bio.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                        {editForm.bio.length}/500
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Avatar URL Field */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => handleEditInputChange('avatar_url', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        editErrors.avatar_url ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    {editErrors.avatar_url && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.avatar_url}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL to an image (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Story Highlights */}
            {!isEditing && (
              <StoryHighlights 
                highlights={highlights} 
                isEditable={isOwnProfile}
                onAddHighlight={handleAddHighlight}
                onViewHighlight={handleViewHighlight}
                onEditHighlight={(highlight) => console.log('Edit highlight:', highlight)}
              />
            )}
            
            {/* Content Tabs (only show when not editing) */}
            {!isEditing && (
              <ContentTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
            )}
          </div>
        </div>

        {/* Content Grid */}
        {!isEditing && (
          <div className="p-4">
            <ContentGrid 
              activeTab={activeTab}
              posts={[userPosts, savedPosts, likedPosts]}
              loading={contentLoading}
              error={null}
              onPostClick={(post) => console.log('Post clicked:', post)}
            />
          </div>
        )}
      </div>
      
      {/* Story Highlight Modal */}
      <StoryHighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        stories={userStories}
        currentHighlights={highlights}
        onSave={handleSaveHighlight}
        isLoading={savingHighlights}
      />
      
      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        profileId={profileData?.id}
        initialTab={followersModalTab}
        followerCount={followerCount}
        followingCount={followingCount}
      />
    </motion.div>
  )
}

export default ProfilePage