import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCircle, 
  FiSquare, 
  FiRotateCcw, 
  FiZap, 
  FiZapOff,
  FiCheck,
  FiMic,
  FiMicOff,
  FiX
} from 'react-icons/fi'
import { CAMERA_CONSTRAINTS, VIDEO_CONSTRAINTS } from '../constants'

function VideoMode({ onCapture, onPreview }) {
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [flashMode, setFlashMode] = useState('off')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [recordingError, setRecordingError] = useState(null)

  const videoRef = useRef(null)
  const previewVideoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [facingMode, audioEnabled])

  // Prevent zoom on double tap - similar to PhotoMode
  useEffect(() => {
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
      console.log('🎥 Starting camera with constraints:', { facingMode, audioEnabled })
      
      if (stream) {
        console.log('🔄 Stopping existing stream')
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          ...CAMERA_CONSTRAINTS.VIDEO,
          facingMode: facingMode
        },
        audio: audioEnabled
      }

      console.log('📱 Requesting media with constraints:', constraints)
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ Camera stream acquired successfully')
      
      setStream(newStream)
      setCameraError(null)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        console.log('📺 Video element updated with stream')
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error)
      setCameraError(error.message)
    }
  }

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleFlash = () => {
    setFlashMode(prev => prev === 'off' ? 'on' : 'off')
  }

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev)
  }

  const getSupportedMimeType = () => {
    // Try different codec options in order of preference
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ]

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('✅ Using supported MIME type:', mimeType)
        return mimeType
      }
    }

    console.warn('⚠️ No supported MIME types found, using default')
    return 'video/webm' // Fallback
  }

  const startRecording = () => {
    if (!stream) {
      console.error('❌ No camera stream available for recording')
      setRecordingError('Camera not available')
      return
    }

    console.log('🎬 Starting video recording')

    try {
      chunksRef.current = []
      setRecordingError(null)

      const mimeType = getSupportedMimeType()
      console.log('🎥 Creating MediaRecorder with MIME type:', mimeType)

      const options = { mimeType }
      
      // Add bitrate for better mobile compatibility
      if (mimeType.includes('webm')) {
        options.videoBitsPerSecond = 2500000 // 2.5 Mbps
        options.audioBitsPerSecond = 128000  // 128 kbps
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options)
      console.log('✅ MediaRecorder created successfully')

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📦 Recording data available, size:', event.data.size)
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 Recording stopped, processing chunks:', chunksRef.current.length)
        
        if (chunksRef.current.length === 0) {
          console.error('❌ No recording data available')
          setRecordingError('Recording failed - no data')
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeType })
        console.log('✅ Video blob created, size:', blob.size)
        
        const url = URL.createObjectURL(blob)
        setRecordedVideo(url)
        
        onCapture({
          type: 'video',
          media: blob,
          mediaUrl: url,
          duration: recordingTime
        })
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error)
        setRecordingError(`Recording error: ${event.error.message}`)
        setIsRecording(false)
      }

      mediaRecorderRef.current.start(1000) // Collect data every second
      console.log('▶️ Recording started')
      
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= VIDEO_CONSTRAINTS.MAX_DURATION / 1000) {
            console.log('⏰ Maximum recording time reached')
            stopRecording()
            return prev
          }
          return newTime
        })
      }, 1000)

    } catch (error) {
      console.error('❌ Error starting recording:', error)
      setRecordingError(`Failed to start recording: ${error.message}`)
    }
  }

  const stopRecording = () => {
    console.log('🛑 Stopping recording')
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
        console.log('✅ MediaRecorder stopped')
      } catch (error) {
        console.error('❌ Error stopping MediaRecorder:', error)
      }
      
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const toggleRecording = () => {
    console.log('🎯 Toggle recording - current state:', isRecording)
    
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const retakeVideo = () => {
    setRecordedVideo(null)
    setRecordingTime(0)
    setRecordingError(null)
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }
  }

  const confirmVideo = () => {
    onPreview?.()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (recordingTime / (VIDEO_CONSTRAINTS.MAX_DURATION / 1000)) * 100

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return <FiZap className="text-yellow-400 text-lg" />
      default: return <FiZapOff className="text-white text-lg" />
    }
  }

  const getFlashLabel = () => {
    switch (flashMode) {
      case 'on': return 'ON'
      default: return 'OFF'
    }
  }

  // Show error state
  if (cameraError) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
          <p className="text-sm text-gray-300 mb-4">{cameraError}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startCamera}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    )
  }

  if (recordedVideo) {
    return (
      <div className="absolute inset-0 bg-black">
        <div className="relative w-full h-full">
          <video
            ref={previewVideoRef}
            src={recordedVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onLoadedData={() => {
              console.log('✅ Video preview loaded successfully')
            }}
            onError={(e) => {
              console.error('❌ Video preview error:', e)
            }}
          />
          
          {/* Top Bar - Close button */}
          <div className="absolute top-40 left-0 right-0 z-10">
            <div className="flex items-center justify-end px-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={retakeVideo}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                <FiX className="text-white text-xl" />
              </motion.button>
            </div>
          </div>
          
          {/* Bottom Actions - Similar to PhotoMode */}
          <div className="absolute bottom-40 left-0 right-0">
            <div className="flex items-center justify-center space-x-12">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={retakeVideo}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <FiRotateCcw className="text-white text-xl" />
                </div>
                <span className="text-white text-xs font-medium">Retake</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={confirmVideo}
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

        {/* Progress Bar - Instagram Style */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-600"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Error */}
        <AnimatePresence>
          {recordingError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 z-20"
            >
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl text-center backdrop-blur-sm">
                <p className="text-sm font-medium">{recordingError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Indicator - iPhone Style */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-3 backdrop-blur-sm shadow-lg">
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-3 h-3 bg-white rounded-full"
                />
                <span className="font-mono font-semibold text-sm tracking-wider">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Controls Bar - Similar to PhotoMode */}
        <div className="absolute top-40 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-6">
            {/* Flash Control */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleFlash}
              disabled={isRecording}
              className="flex flex-col items-center space-y-1 disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                {getFlashIcon()}
              </div>
              <span className="text-white text-xs font-medium opacity-80">
                {getFlashLabel()}
              </span>
            </motion.button>
            
            {/* Audio Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              disabled={isRecording}
              className="flex flex-col items-center space-y-1 disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center ${
                audioEnabled ? 'bg-black/40' : 'bg-red-500/80'
              }`}>
                {audioEnabled ? (
                  <FiMic className="text-white text-lg" />
                ) : (
                  <FiMicOff className="text-white text-lg" />
                )}
              </div>
              <span className="text-white text-xs font-medium opacity-80">
                {audioEnabled ? 'MIC' : 'MUTED'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Controls - iPhone/Instagram Style */}
        <div className="absolute bottom-40 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-8">
            
            {/* Camera Flip Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={flipCamera}
              disabled={isRecording}
              className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center disabled:opacity-50"
            >
              <FiRotateCcw className="text-white text-lg" />
            </motion.button>

            {/* Record Button - iPhone/Instagram Style */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleRecording}
                className="relative z-10"
              >
                {/* Outer Ring */}
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-colors duration-200 ${
                  isRecording ? 'border-red-500' : 'border-white/80'
                }`}>
                  {/* Inner Circle/Square */}
                  <motion.div
                    animate={{
                      scale: isRecording ? 0.6 : 1,
                      borderRadius: isRecording ? '20%' : '50%',
                      backgroundColor: isRecording ? '#ef4444' : '#ffffff'
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="w-16 h-16"
                  />
                </div>
                
                {/* Recording Pulse Effect */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.8, 0, 0.8]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="absolute inset-0 rounded-full border-4 border-red-500"
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
    </div>
  )
}

export default VideoMode