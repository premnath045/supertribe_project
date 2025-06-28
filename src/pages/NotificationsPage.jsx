import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  FiHeart, 
  FiUserPlus, 
  FiMessageCircle, 
  FiDollarSign, 
  FiCheck, 
  FiTrash2,
  FiAtSign,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import useNotifications from '../hooks/useNotifications'
import LoadingSpinner from '../components/UI/LoadingSpinner'

function NotificationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refetch
  } = useNotifications()
  
  // Ref for infinite scroll
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  })
  
  // Sound effect for notifications
  const notificationSoundRef = useRef(null)
  
  // Load more when scrolling to bottom
  useEffect(() => {
    if (loadMoreInView && hasMore && !loading) {
      loadMore()
    }
  }, [loadMoreInView, hasMore, loading, loadMore])
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'mentions'
    ? notifications.filter(notif => notif.type === 'mention')
    : notifications.filter(notif => notif.type === activeTab)
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FiHeart className="text-red-500" />
      case 'follow':
        return <FiUserPlus className="text-blue-500" />
      case 'comment':
        return <FiMessageCircle className="text-green-500" />
      case 'mention':
        return <FiAtSign className="text-purple-500" />
      case 'purchase':
        return <FiDollarSign className="text-yellow-500" />
      default:
        return <FiHeart className="text-gray-500" />
    }
  }
  
  // Get notification text based on type
  const getNotificationText = (notification) => {
    const senderName = notification.sender?.display_name || notification.sender?.username || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`
      case 'follow':
        return `${senderName} started following you`
      case 'comment':
        return `${senderName} commented on your post`
      case 'mention':
        return `${senderName} mentioned you in a comment`
      case 'purchase':
        return `${senderName} purchased your content`
      default:
        return notification.message || 'New notification'
    }
  }
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.metadata?.post_id) {
          navigate(`/post/${notification.metadata.post_id}`)
        }
        break
      case 'follow':
        if (notification.sender?.username) {
          navigate(`/user/${notification.sender.username}`)
        }
        break
      case 'purchase':
        if (notification.metadata?.post_id) {
          navigate(`/post/${notification.metadata.post_id}`)
        }
        break
      default:
        // Default action
        break
    }
  }
  
  // Play notification sound
  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0
      notificationSoundRef.current.play().catch(err => {
        // Ignore autoplay errors - common in browsers
        console.log('Notification sound autoplay prevented:', err)
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSoundRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              
              <div className="flex items-center space-x-2">
                {/* Refresh button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => refetch()}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors rounded-full hover:bg-gray-100"
                >
                  <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
                
                {/* Mark all as read button */}
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1 rounded-full hover:bg-primary-50 transition-colors"
                  >
                    <FiCheck className="text-sm" />
                    <span>Mark all as read</span>
                  </motion.button>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'all', label: 'All' },
                { id: 'like', label: 'Likes', icon: FiHeart },
                { id: 'comment', label: 'Comments', icon: FiMessageCircle },
                { id: 'follow', label: 'Follows', icon: FiUserPlus },
                { id: 'mention', label: 'Mentions', icon: FiAtSign }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-fit py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-1 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon && <tab.icon className="text-sm" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4">
          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center"
            >
              <FiAlertCircle className="text-lg mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Error loading notifications</p>
                <p>{error}</p>
              </div>
            </motion.div>
          )}
          
          {/* Loading state */}
          {loading && notifications.length === 0 && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {/* Empty state */}
          {!loading && filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600">When you get notifications, they'll show up here</p>
            </div>
          )}
          
          {/* Notifications */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
                    notification.is_read 
                      ? 'border-gray-200' 
                      : 'border-primary-200 bg-primary-50/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <img
                        src={notification.sender?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
                        alt={notification.sender?.display_name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 leading-relaxed">
                        {getNotificationText(notification)}
                      </p>
                      
                      {/* Comment preview */}
                      {notification.type === 'comment' && notification.metadata?.comment_text && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          "{notification.metadata.comment_text}"
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Post thumbnail or action buttons */}
                    <div className="flex items-center space-x-2">
                      {notification.metadata?.post_id && notification.metadata?.post_thumbnail && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={notification.metadata.post_thumbnail}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Delete button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <FiTrash2 className="text-sm" />
                      </motion.button>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Loading more indicator */}
          {loading && notifications.length > 0 && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          )}
          
          {/* Load more trigger */}
          {hasMore && !loading && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
          
          {/* End of list */}
          {!hasMore && notifications.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more notifications
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default NotificationsPage