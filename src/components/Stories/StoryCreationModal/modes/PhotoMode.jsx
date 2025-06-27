import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCircle, 
  FiRotateCcw, 
  FiZap, 
  FiZapOff, 
  FiGrid,
  FiCheck,
  FiX
} from 'react-icons/fi'

// Mobile-friendly camera constraints
const CAMERA_CONSTRAINTS = {
  PHOTO: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 }
    // aspectRatio removed for better compatibility
  }
}

function PhotoMode({ onCapture, onPreview }) {
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [flashMode, setFlashMode] = useState('off')
  const [showGrid, setShowGrid] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [focusPoint, setFocusPoint] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [facingMode])

  useEffect(() => {
    // Prevent zoom on double tap
    const handleTouchStart = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      const now = new Date().getTime()
      const timeSince = now - lastTouchEnd
      if (timeSince < 300 && timeSince > 0) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    let lastTouchEnd = 0
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          ...CAMERA_CONSTRAINTS.PHOTO,
          facingMode: facingMode
        }
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleFlash = () => {
    setFlashMode(prev => {
      switch (prev) {
        case 'off': return 'auto'
        case 'auto': return 'on'
        case 'on': return 'off'
        default: return 'off'
      }
    })
  }

  const handleTapToFocus = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setFocusPoint({ x, y })
    setTimeout(() => setFocusPoint(null), 1000)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      
      // Flash effect
      if (flashMode === 'on') {
        const flashOverlay = document.createElement('div')
        flashOverlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          z-index: 9999;
          pointer-events: none;
        `
        document.body.appendChild(flashOverlay)
        setTimeout(() => document.body.removeChild(flashOverlay), 100)
      }
      
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setCapturedPhoto(url)
        
        onCapture?.({
          type: 'photo',
          media: blob,
          mediaUrl: url
        })
      }, 'image/jpeg', 0.9)
      
    } catch (error) {
      console.error('Error capturing photo:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto)
    }
  }

  const confirmPhoto = () => {
    onPreview?.()
  }

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return <FiZap className="text-yellow-400 text-lg" />
      case 'auto': return <FiZap className="text-white text-lg" />
      default: return <FiZapOff className="text-white text-lg" />
    }
  }

  const getFlashLabel = () => {
    switch (flashMode) {
      case 'on': return 'ON'
      case 'auto': return 'AUTO'
      default: return 'OFF'
    }
  }

  if (capturedPhoto) {
    return (
      <div className="absolute inset-0 bg-black">
        <div className="relative w-full h-full">
          <img
            src={capturedPhoto}
            alt="Captured"
            className="w-full h-full object-cover"
          />
          
          {/* Top Bar - Simplified for modal context */}
          <div className="absolute top-40 left-0 right-0 z-10">
            <div className="flex items-center justify-end px-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={retakePhoto}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                <FiX className="text-white text-xl" />
              </motion.button>
            </div>
          </div>
          
          {/* Bottom Actions - Adjusted for modal context */}
          <div className="absolute bottom-40 left-0 right-0">
            <div className="flex items-center justify-center space-x-12">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={retakePhoto}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <FiRotateCcw className="text-white text-xl" />
                </div>
                <span className="text-white text-xs font-medium">Retake</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={confirmPhoto}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                  <FiCheck className="text-white text-xl" />
                </div>
                <span className="text-white text-xs font-medium">Done</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 bg-black overflow-hidden touch-none"
      style={{ 
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }}
    >
      {/* Camera View Container */}
      <div className="relative w-full h-full">
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={handleTapToFocus}
          onTouchStart={handleTapToFocus}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'
            }}
          />
          
          {/* Grid Overlay */}
          <AnimatePresence>
            {showGrid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Focus Point Animation */}
          <AnimatePresence>
            {focusPoint && (
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute pointer-events-none"
                style={{
                  left: `${focusPoint.x}%`,
                  top: `${focusPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-16 h-16 border-2 border-white rounded-full">
                  <div className="w-full h-full border border-white/50 rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top Controls Bar */}
        <div className="absolute top-40 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-6">
            {/* Flash Control */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleFlash}
              className="flex flex-col items-center space-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                {getFlashIcon()}
              </div>
              <span className="text-white text-xs font-medium opacity-80">
                {getFlashLabel()}
              </span>
            </motion.button>
            
            {/* Grid Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowGrid(!showGrid)}
              className="flex flex-col items-center space-y-1"
            >
              <div className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center ${
                showGrid ? 'bg-white/30' : 'bg-black/40'
              }`}>
                <FiGrid className="text-white text-lg" />
              </div>
              <span className="text-white text-xs font-medium opacity-80">
                GRID
              </span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-40 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-8">
            
            {/* Camera Flip Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center"
            >
              <FiRotateCcw className="text-white text-lg" />
            </motion.button>

            {/* Capture Button - Instagram/iPhone Style */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                disabled={isCapturing}
                className="relative z-10"
              >
                {/* Outer Ring */}
                <div className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center">
                  {/* Inner Circle */}
                  <motion.div
                    animate={{
                      scale: isCapturing ? 0.7 : 1,
                      backgroundColor: isCapturing ? '#ffffff' : '#ffffff'
                    }}
                    transition={{ duration: 0.1, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-white"
                  />
                </div>
                
                {/* Capture Effect */}
                <AnimatePresence>
                  {isCapturing && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-full border-4 border-white"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Placeholder for symmetry */}
            <div className="w-12 h-12" />
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default PhotoMode