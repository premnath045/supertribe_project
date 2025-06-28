import { motion } from 'framer-motion'

function TrendingSection({ tags }) {
  return (
    <div className="space-y-3">
      {tags.map((tag, index) => (
        <motion.button
          key={tag.tag}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: 4 }}
          className="w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">#{tag.tag}</h4>
              <p className="text-sm text-gray-500">
                {(typeof tag.count === 'number' ? tag.count.toLocaleString() : '0')} posts
              </p>
            </div>
            <div className="text-primary-500 font-bold text-lg">
              #{index + 1}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

export default TrendingSection