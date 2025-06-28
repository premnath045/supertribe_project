import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiUser, 
  FiLock, 
  FiEye, 
  FiGlobe, 
  FiMoon, 
  FiTrash2,
  FiSave,
  FiAlertCircle
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../UI/LoadingSpinner'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, userProfile, updateUserProfile } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    accountVisibility: 'public',
    allowMessages: 'followers',
    language: 'english',
    theme: 'light'
  })
  
  // UI state
  const [activeSection, setActiveSection] = useState('profile')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Initialize form with user data
  useEffect(() => {
    if (user && userProfile) {
      setFormData(prev => ({
        ...prev,
        username: userProfile.username || '',
        email: user.email || '',
        bio: userProfile.bio || '',
        // Keep other fields as they are
      }))
    }
  }, [user, userProfile])
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  // Validate form based on active section
  const validateForm = () => {
    const newErrors = {}
    
    if (activeSection === 'profile') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required'
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscores)'
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email'
      }
      
      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = 'Bio must be less than 500 characters'
      }
    }
    
    if (activeSection === 'password') {
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          newErrors.currentPassword = 'Current password is required'
        }
        
        if (formData.newPassword.length < 8) {
          newErrors.newPassword = 'Password must be at least 8 characters'
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      if (activeSection === 'profile') {
        // Update profile in Supabase
        const { error } = await updateUserProfile({
          username: formData.username,
          bio: formData.bio
        })
        
        if (error) throw error
        
        // Update email if changed
        if (user.email !== formData.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: formData.email
          })
          
          if (emailError) throw emailError
        }
      }
      
      if (activeSection === 'password' && formData.newPassword) {
        // Update password
        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        
        if (error) throw error
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      }
      
      if (activeSection === 'privacy') {
        // In a real app, you would save these settings to the database
        console.log('Privacy settings updated:', {
          accountVisibility: formData.accountVisibility,
          allowMessages: formData.allowMessages
        })
      }
      
      if (activeSection === 'preferences') {
        // In a real app, you would save these settings to the database
        console.log('Preferences updated:', {
          language: formData.language,
          theme: formData.theme
        })
      }
      
      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
    } catch (error) {
      console.error('Error updating settings:', error)
      setErrors({ general: error.message || 'Failed to update settings' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    
    try {
      // In a real app, you would implement proper account deletion
      // This is just a placeholder
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      setErrors({ general: error.message || 'Failed to delete account' })
    } finally {
      setIsSubmitting(false)
      setShowDeleteConfirm(false)
    }
  }
  
  // If not logged in, redirect to home
  if (!user) {
    navigate('/')
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="ml-4 font-semibold">Settings</h1>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto p-4">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            Settings updated successfully!
          </motion.div>
        )}
        
        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {errors.general}
          </motion.div>
        )}
        
        {/* Settings Navigation */}
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <nav className="flex border-b border-gray-200">
            {[
              { id: 'profile', label: 'Profile', icon: FiUser },
              { id: 'password', label: 'Password', icon: FiLock },
              { id: 'privacy', label: 'Privacy', icon: FiEye },
              { id: 'preferences', label: 'Preferences', icon: FiGlobe }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 py-3 flex flex-col items-center space-y-1 transition-colors ${
                  activeSection === section.id
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <section.icon className="text-lg" />
                <span className="text-xs font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Settings Content */}
          <form onSubmit={handleSubmit} className="p-4">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none ${
                      errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Tell people about yourself..."
                  />
                  <div className="flex justify-end mt-1">
                    <p className={`text-xs ${formData.bio.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.bio.length}/500
                    </p>
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Password Settings */}
            {activeSection === 'password' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Password requirements:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
                
                {/* Account Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Account Visibility
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'public', label: 'Public', description: 'Anyone can see your profile and posts' },
                      { value: 'private', label: 'Private', description: 'Only approved followers can see your posts' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                        <input
                          type="radio"
                          name="accountVisibility"
                          value={option.value}
                          checked={formData.accountVisibility === option.value}
                          onChange={() => handleInputChange('accountVisibility', option.value)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Message Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Who Can Message You
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'everyone', label: 'Everyone', description: 'Any user can send you messages' },
                      { value: 'followers', label: 'Followers', description: 'Only people who follow you can message you' },
                      { value: 'nobody', label: 'Nobody', description: 'Nobody can message you' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                        <input
                          type="radio"
                          name="allowMessages"
                          value={option.value}
                          checked={formData.allowMessages === option.value}
                          onChange={() => handleInputChange('allowMessages', option.value)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Preferences Settings */}
            {activeSection === 'preferences' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="japanese">Japanese</option>
                  </select>
                </div>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: FiSave },
                      { value: 'dark', label: 'Dark', icon: FiMoon }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.theme === option.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={option.value}
                          checked={formData.theme === option.value}
                          onChange={() => handleInputChange('theme', option.value)}
                          className="sr-only"
                        />
                        <option.icon className="text-2xl mb-2" />
                        <span className="font-medium">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Delete Account */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiTrash2 className="text-lg" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Save Button (except for preferences which has its own delete button) */}
            {activeSection !== 'preferences' && (
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="text-lg" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            )}
          </form>
        </div>
        
        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="text-3xl text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
                <p className="text-gray-600">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage