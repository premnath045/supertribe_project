import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiX, FiUser, FiLock, FiBell, FiCreditCard, FiStar, FiHelpCircle, FiLogOut, FiSettings, FiSliders } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const settingsSections = [
  { icon: FiUser, title: 'Account Settings', description: 'Manage your account details', path: '/settings' },
  { icon: FiLock, title: 'Privacy & Security', description: 'Control your privacy settings', path: '/settings' },
  { icon: FiBell, title: 'Notifications', description: 'Manage notification preferences', path: '/notification-settings' },
  { icon: FiCreditCard, title: 'Payment Methods', description: 'Add or edit payment options' },
  { icon: FiHelpCircle, title: 'Help & Support', description: 'Get help and contact support' }
]

function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, userProfile, signOut, isCreator, isFan } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleBecomeCreator = () => {
    onClose()
    navigate('/creator-verification')
  }

  const handleCreatorSettings = () => {
    onClose()
    navigate('/creator-dashboard')
  }

  const handleNavigateToSettings = (path) => {
    if (path) {
      onClose()
      navigate(path)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.user_metadata?.full_name || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {userProfile && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isCreator() 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isCreator() ? 'Verified Creator' : 'Fan'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Creator Status Section */}
            {user && (
              <div className="mb-6">
                {isFan() ? (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBecomeCreator}
                    className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FiStar className="text-xl text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Become a Creator</h3>
                        <p className="text-sm text-white/90">Start monetizing your content and build your audience</p>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreatorSettings}
                    className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FiSettings className="text-xl text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Creator Settings</h3>
                        <p className="text-sm text-white/90">Manage your creator dashboard and analytics</p>
                      </div>
                    </div>
                  </motion.button>
                )}
              </div>
            )}

            {/* Settings Options */}
            <div className="space-y-3">
              {settingsSections.map((section, index) => (
                <motion.button
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigateToSettings(section.path)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg">
                      <section.icon className="text-xl text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* Sign Out Button */}
              {user && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: settingsSections.length * 0.1 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg">
                      <FiLogOut className="text-xl text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-700">Sign Out</h3>
                      <p className="text-sm text-red-600">Sign out of your account</p>
                    </div>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Version Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">CreatorSpace v1.0.0</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SettingsModal