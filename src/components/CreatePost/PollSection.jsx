import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiClock, FiInfo } from 'react-icons/fi'

const POLL_DURATIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '1 Week', value: 7 },
  { label: '2 Weeks', value: 14 },
  { label: '1 Month', value: 30 }
]

function PollSection({ poll, onPollChange, errors = {} }) {
  const [showDurationPicker, setShowDurationPicker] = useState(false)

  const handleTogglePoll = () => {
    if (poll.enabled) {
      onPollChange({
        enabled: false,
        question: '',
        options: ['', ''],
        duration: 7
      })
    } else {
      onPollChange({
        enabled: true,
        question: '',
        options: ['', ''],
        duration: 7
      })
    }
  }

  const handleQuestionChange = (question) => {
    onPollChange({ ...poll, question })
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...poll.options]
    newOptions[index] = value
    onPollChange({ ...poll, options: newOptions })
  }

  const handleAddOption = () => {
    if (poll.options.length < 5) {
      onPollChange({ ...poll, options: [...poll.options, ''] })
    }
  }

  const handleRemoveOption = (index) => {
    if (poll.options.length > 2) {
      const newOptions = poll.options.filter((_, i) => i !== index)
      onPollChange({ ...poll, options: newOptions })
    }
  }

  const handleDurationChange = (duration) => {
    onPollChange({ ...poll, duration })
    setShowDurationPicker(false)
  }

  const selectedDuration = POLL_DURATIONS.find(d => d.value === poll.duration)

  return (
    <div className="space-y-4">
      {/* Poll Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {/* <FiBarChart className="text-blue-600 text-lg" /> */}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Add Poll</h3>
            <p className="text-sm text-gray-600">Let your audience vote</p>
          </div>
        </div>
        <button
          onClick={handleTogglePoll}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            poll.enabled ? 'bg-primary-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              poll.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Poll Configuration */}
      <AnimatePresence>
        {poll.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Poll Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question *
              </label>
              <input
                type="text"
                value={poll.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Ask a question..."
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.question ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                maxLength={100}
              />
              {errors.question && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.question}
                </motion.p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {poll.question.length}/100 characters
              </p>
            </div>

            {/* Poll Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options (2-5)
              </label>
              <div className="space-y-3">
                {poll.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.options && errors.options[index] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      maxLength={50}
                    />
                    {poll.options.length > 2 && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveOption(index)}
                        className="w-8 h-8 text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                      >
                        <FiX className="text-lg" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Add Option Button */}
              {poll.options.length < 5 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddOption}
                  className="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-primary-300 text-gray-600 hover:text-primary-600 py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FiPlus className="text-lg" />
                  <span>Add Option</span>
                </motion.button>
              )}
            
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <FiInfo className="mr-1" />
              <span>You can add up to 5 options</span>
            </div>

              {errors.options && typeof errors.options === 'string' && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600"
                >
                  {errors.options}
                </motion.p>
              )}
            </div>

            {/* Poll Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Duration
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDurationPicker(!showDurationPicker)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <FiClock className="text-gray-400" />
                    <span>{selectedDuration?.label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showDurationPicker ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showDurationPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden"
                    >
                      {POLL_DURATIONS.map((duration) => (
                        <button
                          key={duration.value}
                          onClick={() => handleDurationChange(duration.value)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            poll.duration === duration.value ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                          }`}
                        >
                          {duration.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
        
        {poll.enabled && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Poll Tips:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Keep questions clear and concise</li>
                  <li>Provide distinct options</li>
                  <li>Avoid leading or biased questions</li>
                  <li>Consider the poll duration based on your audience</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PollSection