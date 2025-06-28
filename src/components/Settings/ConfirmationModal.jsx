import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import LoadingSpinner from '../UI/LoadingSpinner'

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText = 'Cancel',
  confirmColor = 'red',
  loading = false,
  icon = FiAlertTriangle
}) {
  const Icon = icon
  
  const getColorClasses = () => {
    switch (confirmColor) {
      case 'red':
        return {
          bg: 'bg-red-500 hover:bg-red-600',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-500'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-500 hover:bg-yellow-600',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-500'
        }
      case 'blue':
        return {
          bg: 'bg-blue-500 hover:bg-blue-600',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500'
        }
      default:
        return {
          bg: 'bg-primary-500 hover:bg-primary-600',
          iconBg: 'bg-primary-100',
          iconColor: 'text-primary-500'
        }
    }
  }
  
  const colorClasses = getColorClasses()
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colorClasses.iconBg} rounded-full flex items-center justify-center`}>
                    <Icon className={`text-xl ${colorClasses.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="text-gray-500" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  {cancelText}
                </button>
                
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-2 ${colorClasses.bg} text-white rounded-lg font-medium transition-colors flex items-center justify-center`}
                >
                  {loading ? <LoadingSpinner size="sm" /> : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal