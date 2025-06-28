import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FiX, 
  FiImage, 
  FiVideo, 
  FiHash,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiSend,
  FiList
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MediaPreviewGrid from '../components/CreatePost/MediaPreviewGrid'
import TagSelectorModal from '../components/CreatePost/TagSelectorModal'
import PollSection from '../components/CreatePost/PollSection'
import PriceSelectorModal from '../components/CreatePost/PriceSelectorModal'
import ScheduleSelectorModal from '../components/CreatePost/ScheduleSelectorModal'
import ScheduledPostsModal from '../components/CreatePost/ScheduledPostsModal'
import ErrorModal from '../components/CreatePost/ErrorModal'
import UploadProgressBar from '../components/CreatePost/UploadProgressBar'
import { format } from 'date-fns'
import SupabaseDebug from '../components/Debug/SupabaseDebug'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']

function CreatePostPage() {
  const navigate = useNavigate()
  const { user, isCreator } = useAuth()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Redirect non-creators
  useEffect(() => {
    if (!isCreator()) {
      navigate('/')
    }
  }, [isCreator, navigate])

  // Post data state
  const [postData, setPostData] = useState({
    content: '',
    media: [],
    tags: [],
    poll: {
      enabled: false,
      question: '',
      options: ['', ''],
      duration: 7
    },
    isPremium: false,
    price: 0,
    subscriberDiscount: 0,
    previewVideo: null,
    scheduledFor: null
  })

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showPriceSelector, setShowPriceSelector] = useState(false)
  const [showScheduleSelector, setShowScheduleSelector] = useState(false)
  const [showScheduledPosts, setShowScheduledPosts] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorDetails, setErrorDetails] = useState(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [postData.content])

  // Validation
  const validatePost = () => {
    console.log('🔍 Validating post...')
    const newErrors = {}

    // Content or media required
    if (!postData.content.trim() && postData.media.length === 0) {
      console.log('❌ Validation failed: No content or media')
      newErrors.general = 'Please add content or media to your post'
    }

    // Poll validation
    if (postData.poll.enabled) {
      if (!postData.poll.question.trim()) {
        console.log('❌ Validation failed: Poll question missing')
        newErrors.poll = { question: 'Poll question is required' }
      }
      
      const validOptions = postData.poll.options.filter(opt => opt.trim())
      if (validOptions.length < 2) {
        console.log('❌ Validation failed: Not enough poll options')
        newErrors.poll = { ...newErrors.poll, options: 'At least 2 poll options are required' }
      }
      
      if (postData.poll.options.some(opt => opt.trim() === '')) {
        console.log('❌ Validation failed: Empty poll options')
        newErrors.poll = { ...newErrors.poll, options: 'All poll options must be filled' }
      }
    }

    // Premium validation
    if (postData.isPremium && (!postData.price || postData.price < 0.99)) {
      console.log('❌ Validation failed: Invalid premium price')
      newErrors.price = 'Premium posts must have a price of at least $0.99'
    }

    // Schedule validation
    if (postData.scheduledFor && new Date(postData.scheduledFor) <= new Date()) {
      console.log('❌ Validation failed: Invalid schedule time')
      newErrors.schedule = 'Scheduled time must be in the future'
    }

    console.log('✅ Validation result:', { errors: newErrors, isValid: Object.keys(newErrors).length === 0 })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if post can be submitted
  const canSubmit = () => {
    const hasContent = postData.content.trim() || postData.media.length > 0
    const notSubmitting = !isSubmitting
    const uploadsComplete = Object.keys(uploadProgress).every(key => uploadProgress[key] === 100)
    
    console.log('🔍 canSubmit check:', {
      hasContent,
      notSubmitting,
      uploadsComplete,
      uploadProgress,
      postDataContent: postData.content,
      mediaLength: postData.media.length
    })
    
    return hasContent && 
           notSubmitting && 
           uploadsComplete
  }

  // Debug canSubmit on every render
  console.log('🔄 Render - canSubmit:', canSubmit(), {
    content: postData.content,
    mediaCount: postData.media.length,
    isSubmitting,
    uploadProgress
  })

  // Check if post can be submitted (original function)
  const canSubmitOriginal = () => {
    return (postData.content.trim() || postData.media.length > 0) && 
           !isSubmitting && 
           Object.keys(uploadProgress).every(key => uploadProgress[key] === 100)
  }

  // Handle media upload
  const handleMediaUpload = async (files) => {
    const validFiles = []
    const invalidFiles = []

    Array.from(files).forEach(file => {
      const isValidImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isValidVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
      const isValidSize = file.size <= MAX_FILE_SIZE

      if ((isValidImage || isValidVideo) && isValidSize) {
        validFiles.push(file)
      } else {
        invalidFiles.push({
          name: file.name,
          reason: !isValidSize ? 'File too large' : 'Invalid file type'
        })
      }
    })

    if (invalidFiles.length > 0) {
      setErrorDetails({
        type: 'validation',
        message: 'Some files could not be uploaded',
        details: invalidFiles.map(f => `${f.name}: ${f.reason}`).join(', ')
      })
      setShowErrorModal(true)
    }

    // Process valid files
    for (const file of validFiles) {
      const mediaId = Date.now() + Math.random()
      const preview = URL.createObjectURL(file)
      
      const mediaItem = {
        id: mediaId,
        file,
        preview,
        type: file.type,
        size: file.size,
        name: file.name
      }

      setPostData(prev => ({
        ...prev,
        media: [...prev.media, mediaItem]
      }))

      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [mediaId]: 0 }))
      
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(prev => ({ ...prev, [mediaId]: progress }))
      }
    }
  }

  // Handle media removal
  const handleMediaRemove = (mediaId) => {
    setPostData(prev => ({
      ...prev,
      media: prev.media.filter(item => item.id !== mediaId)
    }))
    
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[mediaId]
      return newProgress
    })
  }

  // Handle media reorder
  const handleMediaReorder = (fromIndex, toIndex) => {
    setPostData(prev => {
      const newMedia = [...prev.media]
      const [removed] = newMedia.splice(fromIndex, 1)
      newMedia.splice(toIndex, 0, removed)
      return { ...prev, media: newMedia }
    })
  }

  // Upload media to Supabase Storage
  const uploadMediaToStorage = async (mediaItem) => {
    try {
      console.log('📤 Starting media upload:', mediaItem)
      const fileExt = mediaItem.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log('📁 Upload path:', fileName)

      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(fileName, mediaItem.file, {
          cacheControl: '3600',
          upsert: false
        })

      console.log('📤 Storage upload response:', { data, error })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName)

      console.log('🔗 Public URL generated:', publicUrl)

      return publicUrl
    } catch (error) {
      console.error('Error uploading media:', error)
      console.error('❌ Media upload error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
  }

  // Handle post submission
  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called')
    console.log('📊 Current postData:', postData)
    console.log('👤 Current user:', user)
    console.log('✅ canSubmit result:', canSubmit())
    
    if (!validatePost()) return

    setIsSubmitting(true)
    setErrors({})
    
    console.log('🔄 Starting submission process...')

    try {
      // Upload media files
      const mediaUrls = []
      for (const mediaItem of postData.media) {
        console.log('📤 Uploading media:', mediaItem.name)
        const url = await uploadMediaToStorage(mediaItem)
        console.log('✅ Media uploaded:', url)
        mediaUrls.push(url)
      }

      // Upload preview video if exists
      let previewVideoUrl = null
      if (postData.previewVideo?.file) {
        console.log('📹 Uploading preview video...')
        previewVideoUrl = await uploadMediaToStorage({
          file: postData.previewVideo.file,
          name: `preview_${postData.previewVideo.file.name}`
        })
        console.log('✅ Preview video uploaded:', previewVideoUrl)
      }

      // Create post record
      const postRecord = {
        user_id: user.id,
        content: postData.content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        is_premium: postData.isPremium,
        price: postData.isPremium ? postData.price : null,
        subscriber_discount: postData.subscriberDiscount || null,
        tags: postData.tags.length > 0 ? postData.tags : null,
        poll: postData.poll.enabled ? {
          question: postData.poll.question,
          options: postData.poll.options.filter(opt => opt.trim()),
          duration: postData.poll.duration,
          votes: {}, // Will store vote counts by option index
          total_votes: 0
        } : null,
        preview_video_url: previewVideoUrl,
        scheduled_for: postData.scheduledFor,
        status: postData.scheduledFor ? 'scheduled' : 'published'
      }

      console.log('📝 Post record to be created:', postRecord)
      console.log('🔗 Supabase client:', supabase)

      const { data, error } = await supabase
        .from('posts')
        .insert([postRecord])
        .select()
        .single()

      console.log('📤 Supabase response - data:', data)
      console.log('❌ Supabase response - error:', error)

      if (error) throw error

      console.log('✅ Post created successfully:', data)

      // Reset form
      setPostData({
        content: '',
        media: [],
        tags: [],
        poll: {
          enabled: false,
          question: '',
          options: ['', ''],
          duration: 7
        },
        isPremium: false,
        price: 0,
        subscriberDiscount: 0,
        previewVideo: null,
        scheduledFor: null
      })

      // Navigate back
      navigate('/')

    } catch (error) {
      console.error('Error creating post:', error)
      console.error('❌ Full error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      setErrorDetails({
        type: 'network',
        message: 'Failed to create post',
        details: error.message
      })
      setShowErrorModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle premium toggle
  const handlePremiumToggle = () => {
    if (!postData.isPremium) {
      setShowPriceSelector(true)
    } else {
      setPostData(prev => ({
        ...prev,
        isPremium: false,
        price: 0,
        subscriberDiscount: 0,
        previewVideo: null
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="text-xl" />
          </button>
          
          <h1 className="text-lg font-semibold">Create Post</h1>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!canSubmit()}
            onMouseEnter={() => console.log('🖱️ Post button hovered, canSubmit:', canSubmit())}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <FiSend className="text-lg" />
                <span>Post</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Debug Panel - Remove this in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Panel</h3>
          <p className="text-sm text-yellow-700 mb-3">
            This panel helps debug post creation issues. Remove in production.
          </p>
          <SupabaseDebug />
        </div>

        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {errors.general}
          </motion.div>
        )}

        {/* Content Input */}
        <div className="bg-white rounded-xl p-4">
          <textarea
            ref={textareaRef}
            value={postData.content}
            onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="What's on your mind?"
            className="w-full border-0 outline-none resize-none text-lg placeholder-gray-500 min-h-[120px]"
            maxLength={2000}
          />
          
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <div className="flex space-x-3">
              {/* Media Upload */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleMediaUpload(e.target.files)}
                className="hidden"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <FiImage className="text-xl" />
              </motion.button>
              
              {/* Video Upload */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  fileInputRef.current.accept = 'video/*'
                  fileInputRef.current?.click()
                }}
                className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <FiVideo className="text-xl" />
              </motion.button>
            </div>
            
            <span className="text-sm text-gray-500">
              {postData.content.length}/2000
            </span>
          </div>
        </div>

        {/* Media Preview */}
        <MediaPreviewGrid
          media={postData.media}
          onRemove={handleMediaRemove}
          uploadProgress={uploadProgress}
          onReorder={handleMediaReorder}
        />

        {/* Action Buttons */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          {/* Tags */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTagSelector(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiHash className="text-primary-500 text-xl" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Add Tags</p>
                <p className="text-sm text-gray-600">
                  {postData.tags.length > 0 ? `${postData.tags.length} tags selected` : 'Help people discover your post'}
                </p>
              </div>
            </div>
            {postData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {postData.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
                {postData.tags.length > 3 && (
                  <span className="text-gray-500 text-xs">+{postData.tags.length - 3}</span>
                )}
              </div>
            )}
          </motion.button>

          {/* Poll */}
          <PollSection
            poll={postData.poll}
            onPollChange={(poll) => setPostData(prev => ({ ...prev, poll }))}
            errors={errors.poll}
          />

          {/* Premium Toggle */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePremiumToggle}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiDollarSign className="text-green-500 text-xl" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Premium Content</p>
                <p className="text-sm text-gray-600">
                  {postData.isPremium ? `$${postData.price}` : 'Monetize your content'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              postData.isPremium ? 'bg-primary-500' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                postData.isPremium ? 'translate-x-6' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          </motion.button>

          {/* Schedule */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScheduleSelector(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiCalendar className="text-blue-500 text-xl" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Schedule Post</p>
                <p className="text-sm text-gray-600">
                  {postData.scheduledFor 
                    ? format(postData.scheduledFor, 'MMM dd, yyyy \'at\' h:mm a')
                    : 'Publish later'
                  }
                </p>
              </div>
            </div>
            {postData.scheduledFor && (
              <FiClock className="text-blue-500" />
            )}
          </motion.button>

          {/* View Scheduled Posts */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScheduledPosts(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 hover:border-gray-400 rounded-xl transition-colors"
          >
            <FiList className="text-gray-600" />
            <span className="text-gray-700 font-medium">View Scheduled Posts</span>
          </motion.button>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3">Uploading Media</h3>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>File {id.slice(-4)}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <UploadProgressBar progress={progress} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TagSelectorModal
        isOpen={showTagSelector}
        onClose={() => setShowTagSelector(false)}
        selectedTags={postData.tags}
        onTagsChange={(tags) => setPostData(prev => ({ ...prev, tags }))}
      />

      <PriceSelectorModal
        isOpen={showPriceSelector}
        onClose={() => setShowPriceSelector(false)}
        price={postData.price}
        onPriceChange={(price) => {
          setPostData(prev => ({ ...prev, price, isPremium: price > 0 }))
        }}
        subscriberDiscount={postData.subscriberDiscount}
        onDiscountChange={(discount) => setPostData(prev => ({ ...prev, subscriberDiscount: discount }))}
        previewVideo={postData.previewVideo}
        onPreviewVideoChange={(video) => setPostData(prev => ({ ...prev, previewVideo: video }))}
      />

      <ScheduleSelectorModal
        isOpen={showScheduleSelector}
        onClose={() => setShowScheduleSelector(false)}
        scheduledFor={postData.scheduledFor}
        onScheduleChange={(date) => setPostData(prev => ({ ...prev, scheduledFor: date }))}
      />

      <ScheduledPostsModal
        isOpen={showScheduledPosts}
        onClose={() => setShowScheduledPosts(false)}
        onEditPost={(post) => {
          // Handle editing scheduled post
          console.log('Edit post:', post)
        }}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={errorDetails}
        onRetry={() => {
          setShowErrorModal(false)
          if (errorDetails?.type === 'upload') {
            // Retry upload logic
          }
        }}
      />
    </div>
  )
}

export default CreatePostPage