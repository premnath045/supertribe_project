import { motion } from 'framer-motion'
import { FiBell } from 'react-icons/fi'

function EmptyNotifications({ message = "No notifications yet" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiBell className="text-3xl text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      <p className="text-gray-600 max-w-xs mx-auto">
        When you get notifications, they'll show up here. Stay active to receive updates!
      </p>
    </motion.div>
  )
}

export default EmptyNotifications