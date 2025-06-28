import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiUser, 
  FiLock, 
  FiBell, 
  FiLink, 
  FiShield, 
  FiHelpCircle, 
  FiLogOut,
  FiChevronRight
} from 'react-icons/fi'
import FiMail from '../components/Settings/FiMail'
import { useAuth } from '../contexts/AuthContext'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  const settingsSections = [
    { 
      id: 'profile', 
      icon: FiUser, 
      title: 'Edit Profile', 
      description: 'Change your profile information',
      path: '/settings/profile'
    },
    { 
      id: 'privacy', 
      icon: FiShield, 
      title: 'Privacy', 
      description: 'Manage your privacy settings',
      path: '/settings/privacy'
    },
    { 
      id: 'security', 
      icon: FiLock, 
      title: 'Security', 
      description: 'Password and account security',
      path: '/settings/security'
    },
    { 
      id: 'notifications', 
      icon: FiBell, 
      title: 'Notifications', 
      description: 'Manage notification preferences',
      path: '/settings/notifications'
    },
    { 
      id: 'email', 
      icon: FiMail, 
      title: 'Email Settings', 
      description: 'Update your email preferences',
      path: '/settings/email'
    },
    { 
      id: 'connected', 
      icon: FiLink, 
      title: 'Connected Accounts', 
      description: 'Link your social media accounts',
      path: '/settings/connected'
    },
    { 
      id: 'account', 
      icon: FiUser, 
      title: 'Account', 
      description: 'Manage your account status',
      path: '/settings/account'
    },
    { 
      id: 'help', 
      icon: FiHelpCircle, 
      title: 'Help & Support', 
      description: 'Get help and contact support',
      path: '/settings/help'
    }
  ]
  
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const handleNavigate = (path) => {
    // For now, just navigate back to the main page
    // In a real implementation, this would navigate to the specific settings page
    navigate('/')
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
        {/* Settings Sections */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
          {settingsSections.map((section, index) => (
            <motion.button
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleNavigate(section.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <section.icon className="text-gray-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              <FiChevronRight className="text-gray-400" />
            </motion.button>
          ))}
        </div>
        
        {/* Sign Out Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: settingsSections.length * 0.05 }}
          onClick={handleSignOut}
          className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <FiLogOut className="text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-red-700">Sign Out</h3>
            <p className="text-sm text-red-600">Sign out of your account</p>
          </div>
        </motion.button>
        
        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">CreatorSpace v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage