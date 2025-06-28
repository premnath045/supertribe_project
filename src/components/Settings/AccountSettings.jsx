import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiUser, FiLock, FiBell, FiLink, FiShield, FiTrash2, FiAlertTriangle } from 'react-icons/fi'
import FiMail from './FiMail'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ToggleSwitch from './ToggleSwitch'
import SettingsSection from './SettingsSection'
import ConfirmationModal from './ConfirmationModal'

function AccountSettings({ onClose }) {
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showDeactivateConfirmation, setShowDeactivateConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Profile settings state
  const [profileForm, setProfileForm] = useState({
    username: userProfile?.username || '',
    display_name: userProfile?.display_name || '',
    bio: userProfile?.bio || '',
    avatar_url: userProfile?.avatar_url || ''
  })
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    accountVisibility: 'public',
    allowMessages: true,
    showActivity: true,
    allowTagging: true,
    privateMode: false
  })
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    likesNotify: true,
    commentsNotify: true,
    followsNotify: true,
    mentionsNotify: true,
    directMessagesNotify: true,
    marketingEmails: false
  })
  
  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: false,
    facebook: false,
    twitter: false,
    instagram: false
  })
  
  // Handle tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }
  
  // Handle profile form changes
  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle privacy toggle changes
  const handlePrivacyToggle = (setting) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: !prev[setting] }))
  }
  
  // Handle notification toggle changes
  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }))
  }
  
  // Handle account visibility change
  const handleVisibilityChange = (value) => {
    setPrivacySettings(prev => ({ ...prev, accountVisibility: value }))
  }
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would call an API to delete the account
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sign out the user
      await signOut()
      
      // Navigate to home page
      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsSubmitting(false)
      setShowDeleteConfirmation(false)
    }
  }
  
  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would call an API to deactivate the account
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sign out the user
      await signOut()
      
      // Navigate to home page
      navigate('/')
    } catch (error) {
      console.error('Error deactivating account:', error)
    } finally {
      setIsSubmitting(false)
      setShowDeactivateConfirmation(false)
    }
  }
  
  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Profile Information" 
              description="Update your personal information"
              icon={FiUser}
            >
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => handleProfileChange('username', e.target.value.toLowerCase())}
                    className="w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                    placeholder="username"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This is your unique username on the platform
                </p>
              </div>
              
              {/* Display Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.display_name}
                  onChange={(e) => handleProfileChange('display_name', e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                  placeholder="Your display name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is how your name will appear to others
                </p>
              </div>
              
              {/* Bio Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none border-gray-300"
                  placeholder="Tell people about yourself..."
                />
                <div className="flex justify-end mt-1">
                  <p className={`text-xs ${profileForm.bio.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                    {profileForm.bio.length}/500
                  </p>
                </div>
              </div>
              
              {/* Profile Picture URL Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={profileForm.avatar_url}
                  onChange={(e) => handleProfileChange('avatar_url', e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to an image (JPG, PNG, GIF)
                </p>
              </div>
              
              {/* Save Button */}
              <div className="pt-4">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors">
                  Save Profile
                </button>
              </div>
            </SettingsSection>
            
            <SettingsSection 
              title="Email Address" 
              description="Manage your email settings"
              icon={FiMail}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-700 border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your current email address
                </p>
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Change Email Address
                </button>
              </div>
            </SettingsSection>
          </div>
        )
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Privacy Settings" 
              description="Control who can see your content and interact with you"
              icon={FiShield}
            >
              {/* Account Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Visibility
                </label>
                <select
                  value={privacySettings.accountVisibility}
                  onChange={(e) => handleVisibilityChange(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                >
                  <option value="public">Public - Anyone can see your profile</option>
                  <option value="followers">Followers Only - Only followers can see your content</option>
                  <option value="private">Private - Only approved followers can see your content</option>
                </select>
              </div>
              
              {/* Privacy Toggles */}
              <ToggleSwitch
                isOn={privacySettings.allowMessages}
                onToggle={() => handlePrivacyToggle('allowMessages')}
                label="Allow Direct Messages"
                description="Let others send you direct messages"
              />
              
              <ToggleSwitch
                isOn={privacySettings.showActivity}
                onToggle={() => handlePrivacyToggle('showActivity')}
                label="Show Activity Status"
                description="Let others see when you're active"
              />
              
              <ToggleSwitch
                isOn={privacySettings.allowTagging}
                onToggle={() => handlePrivacyToggle('allowTagging')}
                label="Allow Tagging"
                description="Let others tag you in posts and comments"
              />
              
              <ToggleSwitch
                isOn={privacySettings.privateMode}
                onToggle={() => handlePrivacyToggle('privateMode')}
                label="Private Mode"
                description="Hide your activity from everyone"
              />
              
              {/* Save Button */}
              <div className="pt-4">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors">
                  Save Privacy Settings
                </button>
              </div>
            </SettingsSection>
            
            <SettingsSection 
              title="Blocked Accounts" 
              description="Manage accounts you've blocked"
              icon={FiShield}
            >
              <div className="text-center py-4">
                <p className="text-gray-500">You haven't blocked any accounts</p>
              </div>
              
              <div className="pt-2">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Manage Blocked Accounts
                </button>
              </div>
            </SettingsSection>
          </div>
        )
        
      case 'security':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Password" 
              description="Update your password regularly for better security"
              icon={FiLock}
            >
              {/* Current Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                  placeholder="Enter current password"
                />
              </div>
              
              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>
              
              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all border-gray-300"
                  placeholder="Confirm new password"
                />
              </div>
              
              {/* Update Password Button */}
              <div className="pt-4">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors">
                  Update Password
                </button>
              </div>
            </SettingsSection>
            
            <SettingsSection 
              title="Two-Factor Authentication" 
              description="Add an extra layer of security to your account"
              icon={FiShield}
            >
              <ToggleSwitch
                isOn={false}
                onToggle={() => {}}
                label="Enable Two-Factor Authentication"
                description="Require a verification code when signing in"
              />
              
              <div className="pt-4">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Set Up Two-Factor Authentication
                </button>
              </div>
            </SettingsSection>
            
            <SettingsSection 
              title="Login Activity" 
              description="Review your recent login sessions"
              icon={FiShield}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Current Session</p>
                    <p className="text-sm text-gray-500">Web Browser • {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Active
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Previous Login</p>
                    <p className="text-sm text-gray-500">Mobile App • 3 days ago</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  View All Login Activity
                </button>
              </div>
            </SettingsSection>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Notification Preferences" 
              description="Control how you receive notifications"
              icon={FiBell}
            >
              {/* Push Notifications */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Push Notifications</h4>
                <ToggleSwitch
                  isOn={notificationSettings.pushEnabled}
                  onToggle={() => handleNotificationToggle('pushEnabled')}
                  label="Enable Push Notifications"
                  description="Receive notifications on your device"
                />
              </div>
              
              {/* Email Notifications */}
              <div className="pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
                <ToggleSwitch
                  isOn={notificationSettings.emailEnabled}
                  onToggle={() => handleNotificationToggle('emailEnabled')}
                  label="Enable Email Notifications"
                  description="Receive notifications via email"
                />
              </div>
              
              {/* Notification Types */}
              <div className="pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <ToggleSwitch
                    isOn={notificationSettings.likesNotify}
                    onToggle={() => handleNotificationToggle('likesNotify')}
                    label="Likes"
                    description="When someone likes your content"
                  />
                  
                  <ToggleSwitch
                    isOn={notificationSettings.commentsNotify}
                    onToggle={() => handleNotificationToggle('commentsNotify')}
                    label="Comments"
                    description="When someone comments on your content"
                  />
                  
                  <ToggleSwitch
                    isOn={notificationSettings.followsNotify}
                    onToggle={() => handleNotificationToggle('followsNotify')}
                    label="Follows"
                    description="When someone follows you"
                  />
                  
                  <ToggleSwitch
                    isOn={notificationSettings.mentionsNotify}
                    onToggle={() => handleNotificationToggle('mentionsNotify')}
                    label="Mentions"
                    description="When someone mentions you"
                  />
                  
                  <ToggleSwitch
                    isOn={notificationSettings.directMessagesNotify}
                    onToggle={() => handleNotificationToggle('directMessagesNotify')}
                    label="Direct Messages"
                    description="When you receive a direct message"
                  />
                </div>
              </div>
              
              {/* Marketing Emails */}
              <div className="pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Marketing</h4>
                <ToggleSwitch
                  isOn={notificationSettings.marketingEmails}
                  onToggle={() => handleNotificationToggle('marketingEmails')}
                  label="Marketing Emails"
                  description="Receive updates about new features and promotions"
                />
              </div>
              
              {/* Save Button */}
              <div className="pt-4">
                <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors">
                  Save Notification Settings
                </button>
              </div>
            </SettingsSection>
          </div>
        )
        
      case 'connected':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Connected Accounts" 
              description="Link your social media accounts"
              icon={FiLink}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Google</p>
                      <p className="text-sm text-gray-500">
                        {connectedAccounts.google ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-medium ${
                    connectedAccounts.google 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    {connectedAccounts.google ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">f</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Facebook</p>
                      <p className="text-sm text-gray-500">
                        {connectedAccounts.facebook ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-medium ${
                    connectedAccounts.facebook 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    {connectedAccounts.facebook ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">X</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Twitter</p>
                      <p className="text-sm text-gray-500">
                        {connectedAccounts.twitter ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-medium ${
                    connectedAccounts.twitter 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    {connectedAccounts.twitter ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">In</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Instagram</p>
                      <p className="text-sm text-gray-500">
                        {connectedAccounts.instagram ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-medium ${
                    connectedAccounts.instagram 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    {connectedAccounts.instagram ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </SettingsSection>
          </div>
        )
        
      case 'account':
        return (
          <div className="space-y-6">
            <SettingsSection 
              title="Account Status" 
              description="Manage your account status"
              icon={FiUser}
            >
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Temporarily Deactivate Account</h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    Your account will be hidden until you log in again. Your content will not be deleted.
                  </p>
                  <button 
                    onClick={() => setShowDeactivateConfirmation(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Deactivate Account
                  </button>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Permanently Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    This action cannot be undone. All of your data will be permanently deleted.
                  </p>
                  <button 
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </SettingsSection>
            
            <SettingsSection 
              title="Data and Privacy" 
              description="Manage your data and privacy settings"
              icon={FiShield}
            >
              <div className="space-y-4">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Download Your Data
                </button>
                
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Privacy Policy
                </button>
                
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                  Terms of Service
                </button>
              </div>
            </SettingsSection>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 md:border-r border-gray-200 md:h-full overflow-y-auto">
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiUser className="text-lg" />
                <span className="font-medium">Profile</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('privacy')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'privacy' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiShield className="text-lg" />
                <span className="font-medium">Privacy</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('security')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiLock className="text-lg" />
                <span className="font-medium">Security</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'notifications' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiBell className="text-lg" />
                <span className="font-medium">Notifications</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('connected')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'connected' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiLink className="text-lg" />
                <span className="font-medium">Connected Accounts</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('account')}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'account' 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FiUser className="text-lg" />
                <span className="font-medium">Account</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="text-lg" />
            <span>Back to Settings</span>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="pb-20">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost."
        confirmText="Delete Account"
        confirmColor="red"
        loading={isSubmitting}
        icon={FiTrash2}
      />
      
      {/* Deactivate Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeactivateConfirmation}
        onClose={() => setShowDeactivateConfirmation(false)}
        onConfirm={handleDeactivateAccount}
        title="Deactivate Account"
        message="Are you sure you want to temporarily deactivate your account? You can reactivate by logging in again."
        confirmText="Deactivate Account"
        confirmColor="yellow"
        loading={isSubmitting}
        icon={FiAlertTriangle}
      />
    </div>
  )
}

export default AccountSettings