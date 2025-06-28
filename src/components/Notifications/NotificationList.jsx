import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import NotificationItem from './NotificationItem'
import LoadingSpinner from '../UI/LoadingSpinner'
import { FiBell, FiAlertCircle } from 'react-icons/fi'

function NotificationList({ 
  notifications, 
  loading, 
  error, 
  hasMore, 
  onLoadMore, 
  onNotificationClick, 
  onDelete, 
  onMarkAsRead 
}) {
  // Ref for infinite scroll
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  })
  
  // Load more when scrolling to bottom
  useEffect(() => {
    if (loadMoreInView && hasMore && !loading) {
      onLoadMore()
    }
  }, [loadMoreInView, hasMore, loading, onLoadMore])
  
  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center">
          <FiAlertCircle className="text-lg mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading notifications</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Empty state
  if (!loading && notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
        <p className="text-gray-600">When you get notifications, they'll show up here</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* Initial loading state */}
      {loading && notifications.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}
      
      {/* Notifications */}
      <AnimatePresence initial={false}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => onNotificationClick(notification)}
            onDelete={onDelete}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </AnimatePresence>
      
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
  )
}

export default NotificationList