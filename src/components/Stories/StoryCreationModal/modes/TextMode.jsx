import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiType, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight,
  FiBold,
  FiItalic,
  FiCheck,
  FiX
} from 'react-icons/fi'

// Mock constants for demo - replace with your actual imports
const TEXT_FONTS = [
  { name: 'Arial', className: 'font-sans' },
  { name: 'Serif', className: 'font-serif' },
  { name: 'Mono', className: 'font-mono' },
  { name: 'Script', className: 'font-cursive' }
]

const BACKGROUND_COLORS = [
  '#000000', '#1a1a1a', '#4a5568', '#2d3748', '#1a202c',
  '#9f7aea', '#667eea', '#4299e1', '#38b2ac', '#48bb78',
  '#ed8936', '#f56565', '#ec4899', '#d53f8c'
]

const GRADIENT_BACKGROUNDS = [
  'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)'
]

const TEXT_COLORS = [
  '#ffffff', '#000000', '#667eea', '#4299e1', '#38b2ac',
  '#48bb78', '#ed8936', '#f56565', '#ec4899', '#9f7aea'
]

function TextMode({ storyData, onUpdate, onPreview }) {
  const [text, setText] = useState(storyData?.text || 'Tap to add text...')
  const [textStyle, setTextStyle] = useState(storyData?.textStyle || {
    font: 0,
    size: 24,
    color: '#ffffff',
    align: 'center',
    bold: false,
    italic: false
  })
  const [background, setBackground] = useState(storyData?.background || {
    type: 'solid',
    value: '#000000'
  })
  const [showControls, setShowControls] = useState(false)

  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  useEffect(() => {
    onUpdate?.({
      type: 'text',
      text,
      textStyle,
      background
    })
  }, [text, textStyle, background, onUpdate])

  const updateTextStyle = (updates) => {
    setTextStyle(prev => ({ ...prev, ...updates }))
  }

  const updateBackground = (updates) => {
    setBackground(prev => ({ ...prev, ...updates }))
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
  }

  const getBackgroundStyle = () => {
    if (background.type === 'gradient') {
      return { background: background.value }
    }
    return { backgroundColor: background.value }
  }

  const getTextClassName = () => {
    const font = TEXT_FONTS[textStyle.font]
    let className = font.className
    
    if (textStyle.bold) className += ' font-bold'
    if (textStyle.italic) className += ' italic'
    
    return className
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* Main Text Area */}
      <div 
        className="h-full flex items-center justify-center p-8 cursor-pointer transition-all duration-300"
        style={getBackgroundStyle()}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Tap to add text..."
          className={`w-full max-w-md bg-transparent border-none outline-none resize-none text-center placeholder-white/40 transition-all duration-200 ${getTextClassName()}`}
          style={{
            color: textStyle.color,
            fontSize: `${textStyle.size}px`,
            textAlign: textStyle.align,
            lineHeight: '1.3',
          }}
          rows={6}
        />
      </div>

      {/* Done Button */}
      <AnimatePresence>
        {text.trim() && text !== 'Tap to add text...' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPreview}
            className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm z-50 hover:shadow-xl transition-all duration-200"
          >
            <FiCheck className="text-black text-xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Edit Button BELOW Done Button */}
      <AnimatePresence>
        {!showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowControls(true)}
            className="absolute top-24 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm z-50 hover:shadow-xl transition-all duration-200"
          >
            <FiType className="text-black text-xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowControls(false)}
            />
            
            {/* Controls Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 rounded-t-3xl shadow-2xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowControls(false)}
                className="absolute top-4 right-6 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX className="text-lg" />
              </button>

              <div className="px-6 pb-8 space-y-6">
                {/* Font Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Font Style</h3>
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {TEXT_FONTS.map((font, index) => (
                      <motion.button
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateTextStyle({ font: index })}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium transition-all duration-200 ${
                          textStyle.font === index 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {font.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Text Styling */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Text Style</h3>
                  <div className="flex justify-center space-x-4">
                    {/* Alignment */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      {[
                        { align: 'left', icon: FiAlignLeft },
                        { align: 'center', icon: FiAlignCenter },
                        { align: 'right', icon: FiAlignRight }
                      ].map(({ align, icon: Icon }) => (
                        <motion.button
                          key={align}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => updateTextStyle({ align })}
                          className={`p-3 rounded-lg transition-all duration-200 ${
                            textStyle.align === align 
                              ? 'bg-white text-blue-500 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <Icon className="text-lg" />
                        </motion.button>
                      ))}
                    </div>

                    {/* Bold/Italic */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateTextStyle({ bold: !textStyle.bold })}
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          textStyle.bold 
                            ? 'bg-white text-blue-500 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <FiBold className="text-lg" />
                      </motion.button>
                      
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateTextStyle({ italic: !textStyle.italic })}
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          textStyle.italic 
                            ? 'bg-white text-blue-500 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <FiItalic className="text-lg" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Font Size</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 w-6">16</span>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={textStyle.size}
                      onChange={(e) => updateTextStyle({ size: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((textStyle.size - 16) / (48 - 16)) * 100}%, #e5e7eb ${((textStyle.size - 16) / (48 - 16)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span className="text-sm text-gray-600 w-6 text-right">48</span>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium min-w-12 text-center">
                      {textStyle.size}
                    </div>
                  </div>
                </div>

                {/* Text Colors */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Text Color</h3>
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {TEXT_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateTextStyle({ color })}
                        className={`w-10 h-10 rounded-full border-3 transition-all duration-200 flex-shrink-0 ${
                          textStyle.color === color 
                            ? 'border-blue-500 shadow-lg scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Background</h3>
                  
                  {/* Background Type Toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1 w-fit mx-auto">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateBackground({ type: 'solid' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        background.type === 'solid' 
                          ? 'bg-white text-blue-500 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Solid
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateBackground({ type: 'gradient' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        background.type === 'gradient' 
                          ? 'bg-white text-blue-500 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Gradient
                    </motion.button>
                  </div>

                  {/* Background Colors/Gradients */}
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {background.type === 'solid' ? (
                      BACKGROUND_COLORS.map((color) => (
                        <motion.button
                          key={color}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateBackground({ value: color })}
                          className={`w-10 h-10 rounded-full border-3 transition-all duration-200 flex-shrink-0 ${
                            background.value === color 
                              ? 'border-blue-500 shadow-lg scale-110' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))
                    ) : (
                      GRADIENT_BACKGROUNDS.map((gradient, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateBackground({ value: gradient })}
                          className={`w-10 h-10 rounded-full border-3 transition-all duration-200 flex-shrink-0 ${
                            background.value === gradient 
                              ? 'border-blue-500 shadow-lg scale-110' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ background: gradient }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default TextMode