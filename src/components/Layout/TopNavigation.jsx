import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSettings, FiHeart, FiUser, FiBell } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from '../Auth/AuthModal'
import useNotifications from '../../hooks/useNotifications'

function TopNavigation({ onSettingsClick }) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ fetchOnMount: true })
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <motion.header 
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold gradient-text">
              SuperTribe
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/notifications"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                >
                  <FiHeart className="text-xl" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Link>
                
                <button 
                  onClick={onSettingsClick}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
                >
                  <FiBell className="text-xl" />
                  {unreadCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 flex items-center justify-center"
                    >
                      <div className={`${unreadCount > 9 ? 'w-5 h-5 text-xs' : 'w-4 h-4 text-xs'} bg-red-500 rounded-full flex items-center justify-center text-white font-bold`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    </motion.div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-10 transition-opacity"></span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FiUser className="text-lg" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  )
}

export default TopNavigation