import { motion, AnimatePresence } from 'framer-motion'

function NotificationBadge({ count, size = 'md', className = '' }) {
  if (!count || count <= 0) return null
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  }
  
  const displayCount = count > 99 ? '99+' : count
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`${sizeClasses[size]} bg-red-500 rounded-full flex items-center justify-center text-white font-bold ${className}`}
      >
        {displayCount}
      </motion.div>
    </AnimatePresence>
  )
}

export default NotificationBadge