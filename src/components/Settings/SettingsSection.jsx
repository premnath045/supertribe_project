import { motion } from 'framer-motion'

function SettingsSection({ title, description, children, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        {Icon && (
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Icon className="text-xl text-primary-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  )
}

export default SettingsSection