import { motion } from 'framer-motion'

function ToggleSwitch({ isOn, onToggle, label, description, disabled = false }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isOn}
          onChange={onToggle}
          disabled={disabled}
          className="sr-only peer"
        />
        <motion.div
          animate={{
            backgroundColor: isOn ? '#ec4899' : '#e5e7eb'
          }}
          className={`w-11 h-6 rounded-full peer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300`}
        >
          <motion.div
            animate={{
              x: isOn ? 20 : 2,
              backgroundColor: '#ffffff'
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-[2px] left-[2px] w-5 h-5 rounded-full border border-gray-300"
          />
        </motion.div>
      </label>
    </div>
  )
}

export default ToggleSwitch