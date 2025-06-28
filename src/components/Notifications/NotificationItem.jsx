import { motion } from 'framer-motion'
import { 
  FiHeart, 
  FiUserPlus, 
  FiMessageCircle, 
  FiDollarSign, 
  FiAtSign,
  FiTrash2
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

function NotificationItem({ 
  notification, 
  onClick, 
  onDelete,
  onMarkAsRead
}) {
  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
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
  const getNotificationText = () => {
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
  
  // Handle click
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
    onClick(notification)
  }
  
  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleClick}
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
            {getNotificationIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 leading-relaxed">
            {getNotificationText()}
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
            onClick={handleDelete}
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
  )
}

export default NotificationItem