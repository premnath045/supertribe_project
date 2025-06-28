import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiMail, 
  FiLink, 
  FiShield,
  FiEye, 
  FiEyeOff, 
  FiCheck, 
  FiX, 
  FiAlertTriangle,
  FiUpload,
  FiTrash2,
  FiGlobe,
  FiMessageCircle,
  FiLogOut
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { validateEmail, validatePassword } from '../../utils/validation'
import LoadingSpinner from '../UI/LoadingSpinner'

function AccountSettings({ onClose }) {
  const { user, userProfile, updateUserProfile, signOut } = useAuth()
  
  // State for active section
  const [activeSection, setActiveSection] = useState('profile')
  
  // State for form data
  const [profileForm, setProfileForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    account_visibility: 'public',
    message_privacy: 'followers',
    post_visibility: 'public',
    show_activity_status: true,
    allow_mentions: 'everyone'
  })
  
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
    message_notifications: true,
    marketing_emails: false
  })
  
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: false,
    facebook: false,
    twitter: false,
    instagram: false
  })
  
  // State for loading and errors
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)
  
  // State for confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Initialize form data from user profile
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        username: userProfile.username || '',
        display_name: userProfile.display_name || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      })
    }
    
    // In a real app, you would fetch these settings from the database
    // For this demo, we'll use default values
  }, [userProfile])
  
  // Handle profile form changes
  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  // Handle privacy settings changes
  const handlePrivacyChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle security form changes
  const handleSecurityChange = (field, value) => {
    setSecurityForm(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  // Handle notification settings changes
  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
  }
  
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {}
    
    if (!profileForm.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (profileForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!profileForm.display_name.trim()) {
      newErrors.display_name = 'Display name is required'
    }
    
    if (profileForm.bio && profileForm.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Validate security form
  const validateSecurityForm = () => {
    const newErrors = {}
    
    if (!securityForm.current_password) {
      newErrors.current_password = 'Current password is required'
    }
    
    if (!securityForm.new_password) {
      newErrors.new_password = 'New password is required'
    } else {
      const passwordValidation = validatePassword(securityForm.new_password)
      if (!passwordValidation.isValid) {
        newErrors.new_password = passwordValidation.message
      }
    }
    
    if (!securityForm.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password'
    } else if (securityForm.new_password !== securityForm.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return
    
    setLoading(true)
    setSuccess(null)
    
    try {
      // Check if username is already taken (if changed)
      if (profileForm.username !== userProfile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', profileForm.username)
          .single()
          
        if (existingUser) {
          setErrors({ username: 'Username is already taken' })
          setLoading(false)
          return
        }
      }
      
      // Update profile in database
      const { error } = await updateUserProfile({
        username: profileForm.username,
        display_name: profileForm.display_name,
        bio: profileForm.bio,
        avatar_url: profileForm.avatar_url
      })
      
      if (error) throw error
      
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ general: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }
  
  // Save privacy settings
  const handleSavePrivacy = async () => {
    setLoading(true)
    setSuccess(null)
    
    try {
      // In a real app, you would save these settings to the database
      // For this demo, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSuccess('Privacy settings updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      setErrors({ general: 'Failed to update privacy settings' })
    } finally {
      setLoading(false)
    }
  }
  
  // Change password
  const handleChangePassword = async () => {
    if (!validateSecurityForm()) return
    
    setLoading(true)
    setSuccess(null)
    
    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: securityForm.new_password
      })
      
      if (error) throw error
      
      // Clear form
      setSecurityForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
      setSuccess('Password changed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      setErrors({ general: 'Failed to change password. Please check your current password.' })
    } finally {
      setLoading(false)
    }
  }
  
  // Save notification settings
  const handleSaveNotifications = async () => {
    setLoading(true)
    setSuccess(null)
    
    try {
      // In a real app, you would save these settings to the database
      // For this demo, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSuccess('Notification settings updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating notification settings:', error)
      setErrors({ general: 'Failed to update notification settings' })
    } finally {
      setLoading(false)
    }
  }
  
  // Connect social account
  const handleConnectAccount = async (platform) => {
    setLoading(true)
    
    try {
      // In a real app, you would implement OAuth flow
      // For this demo, we'll just simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setConnectedAccounts(prev => ({
        ...prev,
        [platform]: true
      }))
    } catch (error) {
      console.error(`Error connecting ${platform} account:`, error)
      setErrors({ general: `Failed to connect ${platform} account` })
    } finally {
      setLoading(false)
    }
  }
  
  // Disconnect social account
  const handleDisconnectAccount = async (platform) => {
    setLoading(true)
    
    try {
      // In a real app, you would remove the connection from the database
      // For this demo, we'll just simulate a successful disconnection
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setConnectedAccounts(prev => ({
        ...prev,
        [platform]: false
      }))
    } catch (error) {
      console.error(`Error disconnecting ${platform} account:`, error)
      setErrors({ general: `Failed to disconnect ${platform} account` })
    } finally {
      setLoading(false)
    }
  }
  
  // Deactivate account
  const handleDeactivateAccount = async () => {
    setLoading(true)
    
    try {
      // In a real app, you would deactivate the account in the database
      // For this demo, we'll just sign out
      await new Promise(resolve => setTimeout(resolve, 1000))
      await signOut()
      onClose()
    } catch (error) {
      console.error('Error deactivating account:', error)
      setErrors({ general: 'Failed to deactivate account' })
      setLoading(false)
    }
  }
  
  // Delete account
  const handleDeleteAccount = async () => {
    setLoading(true)
    
    try {
      // In a real app, you would delete the account from the database
      // For this demo, we'll just sign out
      await new Promise(resolve => setTimeout(resolve, 1000))
      await signOut()
      onClose()
    } catch (error) {
      console.error('Error deleting account:', error)
      setErrors({ general: 'Failed to delete account' })
      setLoading(false)
    }
  }
  
  // Render profile section
  const renderProfileSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
      
      {/* Avatar */}
      <div className="flex items-center space-x-4">
        <img
          src={profileForm.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <div className="flex space-x-2">
            <button className="text-sm bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center space-x-1">
              <FiUpload className="text-xs" />
              <span>Upload</span>
            </button>
            <button className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition-colors flex items-center space-x-1">
              <FiTrash2 className="text-xs" />
              <span>Remove</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
        </div>
      </div>
      
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
          <input
            type="text"
            value={profileForm.username}
            onChange={(e) => handleProfileChange('username', e.target.value.toLowerCase())}
            className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>
      
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={profileForm.display_name}
          onChange={(e) => handleProfileChange('display_name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            errors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.display_name && (
          <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>
        )}
      </div>
      
      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio
        </label>
        <textarea
          value={profileForm.bio}
          onChange={(e) => handleProfileChange('bio', e.target.value)}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none ${
            errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Tell people about yourself..."
        />
        <div className="flex justify-between items-center mt-1">
          {errors.bio ? (
            <p className="text-sm text-red-600">{errors.bio}</p>
          ) : (
            <div></div>
          )}
          <p className={`text-xs ${profileForm.bio.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
            {profileForm.bio.length}/500
          </p>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <FiCheck className="text-sm" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
  
  // Render privacy section
  const renderPrivacySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
      
      {/* Account Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Account Visibility
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50">
            <input
              type="radio"
              name="account_visibility"
              checked={privacySettings.account_visibility === 'public'}
              onChange={() => handlePrivacyChange('account_visibility', 'public')}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Public</p>
              <p className="text-sm text-gray-500">Anyone can view your profile and posts</p>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50">
            <input
              type="radio"
              name="account_visibility"
              checked={privacySettings.account_visibility === 'private'}
              onChange={() => handlePrivacyChange('account_visibility', 'private')}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Private</p>
              <p className="text-sm text-gray-500">Only approved followers can view your profile and posts</p>
            </div>
          </label>
        </div>
      </div>
      
      {/* Message Privacy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Who Can Message You
        </label>
        <select
          value={privacySettings.message_privacy}
          onChange={(e) => handlePrivacyChange('message_privacy', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers Only</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>
      
      {/* Post Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Post Visibility
        </label>
        <select
          value={privacySettings.post_visibility}
          onChange={(e) => handlePrivacyChange('post_visibility', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
          <option value="public">Public</option>
          <option value="followers">Followers Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      
      {/* Activity Status */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <p className="font-medium text-gray-900">Show Activity Status</p>
          <p className="text-sm text-gray-500">Let others see when you're online</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={privacySettings.show_activity_status}
            onChange={(e) => handlePrivacyChange('show_activity_status', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
        </label>
      </div>
      
      {/* Mentions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Allow Mentions From
        </label>
        <select
          value={privacySettings.allow_mentions}
          onChange={(e) => handlePrivacyChange('allow_mentions', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers Only</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSavePrivacy}
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <FiCheck className="text-sm" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
  
  // Render security section
  const renderSecuritySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
      
      {/* Change Password */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Change Password</h4>
        
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? 'text' : 'password'}
              value={securityForm.current_password}
              onChange={(e) => handleSecurityChange('current_password', e.target.value)}
              className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.current_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.current ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.current_password && (
            <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
          )}
        </div>
        
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? 'text' : 'password'}
              value={securityForm.new_password}
              onChange={(e) => handleSecurityChange('new_password', e.target.value)}
              className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.new_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.new ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.new_password && (
            <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
          )}
        </div>
        
        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              value={securityForm.confirm_password}
              onChange={(e) => handleSecurityChange('confirm_password', e.target.value)}
              className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
          )}
        </div>
        
        {/* Update Password Button */}
        <div className="flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FiLock className="text-sm" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Two-Factor Authentication */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
            Set Up
          </button>
        </div>
      </div>
      
      {/* Login History */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Login History</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Current Session</p>
                <p className="text-sm text-gray-500">Web Browser - {navigator.userAgent.split(' ').slice(-1)[0]}</p>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                Active Now
              </span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-center text-sm text-gray-500">
              Login history is available in the full version
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render notifications section
  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Email & Notifications</h3>
      
      {/* Email Preferences */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Email Preferences</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.email_notifications}
                onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-500">Receive updates and promotions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.marketing_emails}
                onChange={(e) => handleNotificationChange('marketing_emails', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Push Notifications */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Push Notifications</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Enable browser notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.push_notifications}
                onChange={(e) => handleNotificationChange('push_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Notification Types */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Likes</p>
              <p className="text-sm text-gray-500">When someone likes your content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.like_notifications}
                onChange={(e) => handleNotificationChange('like_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Comments</p>
              <p className="text-sm text-gray-500">When someone comments on your content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.comment_notifications}
                onChange={(e) => handleNotificationChange('comment_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Follows</p>
              <p className="text-sm text-gray-500">When someone follows you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.follow_notifications}
                onChange={(e) => handleNotificationChange('follow_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Messages</p>
              <p className="text-sm text-gray-500">When you receive a new message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.message_notifications}
                onChange={(e) => handleNotificationChange('message_notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveNotifications}
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <FiCheck className="text-sm" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
  
  // Render connected accounts section
  const renderConnectedAccountsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
      <p className="text-sm text-gray-600">
        Connect your social media accounts to share content and login more easily.
      </p>
      
      <div className="space-y-4">
        {/* Google */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">G</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Google</p>
              <p className="text-sm text-gray-500">
                {connectedAccounts.google ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {connectedAccounts.google ? (
            <button
              onClick={() => handleDisconnectAccount('google')}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnectAccount('google')}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
        
        {/* Facebook */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">F</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Facebook</p>
              <p className="text-sm text-gray-500">
                {connectedAccounts.facebook ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {connectedAccounts.facebook ? (
            <button
              onClick={() => handleDisconnectAccount('facebook')}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnectAccount('facebook')}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
        
        {/* Twitter */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">T</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Twitter</p>
              <p className="text-sm text-gray-500">
                {connectedAccounts.twitter ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {connectedAccounts.twitter ? (
            <button
              onClick={() => handleDisconnectAccount('twitter')}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnectAccount('twitter')}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
        
        {/* Instagram */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-bold">I</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Instagram</p>
              <p className="text-sm text-gray-500">
                {connectedAccounts.instagram ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {connectedAccounts.instagram ? (
            <button
              onClick={() => handleDisconnectAccount('instagram')}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnectAccount('instagram')}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
  
  // Render account status section
  const renderAccountStatusSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
      
      {/* Deactivate Account */}
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <h4 className="font-medium text-gray-900 mb-2">Deactivate Account</h4>
        <p className="text-sm text-gray-600 mb-4">
          Temporarily disable your account. You can reactivate anytime by signing in again.
        </p>
        <button
          onClick={() => setShowDeactivateConfirm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Deactivate Account
        </button>
      </div>
      
      {/* Delete Account */}
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete your account and all your data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
  
  // Render active section content
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection()
      case 'privacy':
        return renderPrivacySection()
      case 'security':
        return renderSecuritySection()
      case 'notifications':
        return renderNotificationsSection()
      case 'connected':
        return renderConnectedAccountsSection()
      case 'account':
        return renderAccountStatusSection()
      default:
        return renderProfileSection()
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <FiCheck className="text-green-500 mr-2" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-700 hover:text-green-900"
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Message */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-2" />
              <span>{errors.general}</span>
            </div>
            <button
              onClick={() => setErrors(prev => ({ ...prev, general: null }))}
              className="text-red-700 hover:text-red-900"
            >
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:border-r border-gray-200 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'profile'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiUser className={activeSection === 'profile' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Profile Information</span>
            </button>
            
            <button
              onClick={() => setActiveSection('privacy')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'privacy'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiShield className={activeSection === 'privacy' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Privacy Settings</span>
            </button>
            
            <button
              onClick={() => setActiveSection('security')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'security'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiLock className={activeSection === 'security' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Security Settings</span>
            </button>
            
            <button
              onClick={() => setActiveSection('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'notifications'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiBell className={activeSection === 'notifications' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Email & Notifications</span>
            </button>
            
            <button
              onClick={() => setActiveSection('connected')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'connected'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiLink className={activeSection === 'connected' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Connected Accounts</span>
            </button>
            
            <button
              onClick={() => setActiveSection('account')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'account'
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FiUser className={activeSection === 'account' ? 'text-primary-500' : 'text-gray-500'} />
              <span>Account Status</span>
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={signOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiLogOut className="text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Deactivate Account Confirmation Modal */}
      <AnimatePresence>
        {showDeactivateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDeactivateConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FiAlertTriangle className="text-3xl text-yellow-500" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Deactivate Account?
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  Your account will be temporarily disabled and hidden from other users.
                  You can reactivate anytime by signing in again.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={loading}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Deactivate Account'}
                  </button>
                  
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <FiAlertTriangle className="text-3xl text-red-500" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Delete Account Permanently?
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Delete Permanently'}
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccountSettings