import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiUserPlus, 
  FiHeart, 
  FiMessageCircle, 
  FiAtSign,
  FiVideo,
  FiMail,
  FiSmartphone,
  FiVolume2,
  FiSave
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../UI/LoadingSpinner'

function NotificationSettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Notification settings state
  const [settings, setSettings] = useState({
    push: {
      newFollowers: true,
      likesComments: true,
      directMessages: true,
      postMentions: true,
      storyMentions: true,
      liveBroadcasts: false
    },
    email: {
      newFollowers: false,
      likesComments: false,
      directMessages: true,
      postMentions: false,
      storyMentions: false,
      liveBroadcasts: false,
      productUpdates: true,
      marketingEmails: false
    },
    inApp: {
      newFollowers: true,
      likesComments: true,
      directMessages: true,
      postMentions: true,
      storyMentions: true,
      liveBroadcasts: true
    },
    sound: {
      enabled: true,
      vibration: true,
      messagePreview: true
    }
  })
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Toggle a notification setting
  const toggleSetting = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }))
  }
  
  // Save notification settings
  const handleSave = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    
    try {
      // In a real app, you would save these settings to the database
      console.log('Saving notification settings:', settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
    } catch (error) {
      console.error('Error saving notification settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // If not logged in, redirect to home
  if (!user) {
    navigate('/')
    return null
  }
  
  // Render a toggle switch
  const ToggleSwitch = ({ isOn, onToggle, disabled = false }) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? 'bg-primary-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
  
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
          <h1 className="ml-4 font-semibold">Notification Settings</h1>
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
            Notification settings updated successfully!
          </motion.div>
        )}
        
        {/* Push Notifications */}
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-1">
              <FiSmartphone className="text-lg text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Notifications that appear on your device
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {[
              { id: 'newFollowers', label: 'New Followers', icon: FiUserPlus },
              { id: 'likesComments', label: 'Likes and Comments', icon: FiHeart },
              { id: 'directMessages', label: 'Direct Messages', icon: FiMessageCircle },
              { id: 'postMentions', label: 'Post Mentions', icon: FiAtSign },
              { id: 'storyMentions', label: 'Story Mentions', icon: FiAtSign },
              { id: 'liveBroadcasts', label: 'Live Broadcasts', icon: FiVideo }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <item.icon className="text-gray-500" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <ToggleSwitch
                  isOn={settings.push[item.id]}
                  onToggle={() => toggleSetting('push', item.id)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Email Notifications */}
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-1">
              <FiMail className="text-lg text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Notifications sent to your email address
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {[
              { id: 'newFollowers', label: 'New Followers', icon: FiUserPlus },
              { id: 'likesComments', label: 'Likes and Comments', icon: FiHeart },
              { id: 'directMessages', label: 'Direct Messages', icon: FiMessageCircle },
              { id: 'postMentions', label: 'Post Mentions', icon: FiAtSign },
              { id: 'storyMentions', label: 'Story Mentions', icon: FiAtSign },
              { id: 'liveBroadcasts', label: 'Live Broadcasts', icon: FiVideo },
              { id: 'productUpdates', label: 'Product Updates', icon: FiMail },
              { id: 'marketingEmails', label: 'Marketing Emails', icon: FiMail }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <item.icon className="text-gray-500" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <ToggleSwitch
                  isOn={settings.email[item.id]}
                  onToggle={() => toggleSetting('email', item.id)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* In-App Notifications */}
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-1">
              <FiSmartphone className="text-lg text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">In-App Notifications</h2>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Notifications that appear within the app
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {[
              { id: 'newFollowers', label: 'New Followers', icon: FiUserPlus },
              { id: 'likesComments', label: 'Likes and Comments', icon: FiHeart },
              { id: 'directMessages', label: 'Direct Messages', icon: FiMessageCircle },
              { id: 'postMentions', label: 'Post Mentions', icon: FiAtSign },
              { id: 'storyMentions', label: 'Story Mentions', icon: FiAtSign },
              { id: 'liveBroadcasts', label: 'Live Broadcasts', icon: FiVideo }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <item.icon className="text-gray-500" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <ToggleSwitch
                  isOn={settings.inApp[item.id]}
                  onToggle={() => toggleSetting('inApp', item.id)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Sound and Vibration */}
        <div className="bg-white rounded-xl overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-1">
              <FiVolume2 className="text-lg text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Sound & Vibration</h2>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Control notification sounds and vibrations
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {[
              { id: 'enabled', label: 'Notification Sounds', icon: FiVolume2 },
              { id: 'vibration', label: 'Vibration', icon: FiSmartphone },
              { id: 'messagePreview', label: 'Message Preview', icon: FiMessageCircle }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <item.icon className="text-gray-500" />
                  <span className="text-gray-900">{item.label}</span>
                </div>
                <ToggleSwitch
                  isOn={settings.sound[item.id]}
                  onToggle={() => toggleSetting('sound', item.id)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Save Button */}
        <motion.button
          onClick={handleSave}
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
      </div>
    </div>
  )
}

export default NotificationSettingsPage