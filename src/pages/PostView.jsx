import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiArrowLeft, 
  FiHeart, 
  FiMessageCircle, 
  FiShare, 
  FiBookmark,
  FiMoreHorizontal,
  FiLock,
  FiFlag,
  FiEye,
  FiBarChart2,
  FiClock
} from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

// Import components
import MediaCarousel from '../components/Media/MediaCarousel'
import CommentsList from '../components/Comments/CommentsList'
import CommentForm from '../components/Comments/CommentForm'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { useComments } from '../hooks/useComments'

function PostView() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [shareCount, setShareCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [interactionLoading, setInteractionLoading] = useState(false)
  const [userVote, setUserVote] = useState(null)
  
  // Comments using the comments hook
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    submitting,
    addComment,
    deleteComment
  } = useComments(postId)
  
  // Fetch post data
  useEffect(() => {
    if (postId) {
      fetchPostData()
    }
  }, [postId])
  
  const fetchPostData = async () => {
    if (!postId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch post with profile data
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            user_type
          )
        `)
        .eq('id', postId)
        .single()
      
      if (error) {
        console.error('Error fetching post:', error)
        throw new Error('Post not found or unavailable')
      }
      
      if (!data) {
        throw new Error('Post not found')
      }
      
      // Check like and save status if user is logged in
      if (user) {
        const [likeResponse, saveResponse] = await Promise.all([
          supabase.from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single(),
            
          supabase.from('post_saves')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single()
        ])
        
        setIsLiked(!likeResponse.error)
        setIsSaved(!saveResponse.error)
      }
      
      // Process post data
      const processedPost = {
        ...data,
        user: {
          id: data.user_id,
          displayName: data.profiles?.display_name || 'Unknown User',
          username: data.profiles?.username || 'unknown',
          avatar: data.profiles?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          isVerified: data.profiles?.is_verified || false,
          isPremium: data.profiles?.user_type === 'creator' && data.profiles?.is_verified
        },
        createdAt: new Date(data.created_at)
      }
      
      setPost(processedPost)
      setLikeCount(data.like_count || 0)
      setCommentCount(data.comment_count || 0)
      setShareCount(data.share_count || 0)
      setViewCount(data.view_count || 0)
      
      // Record view if not own post
      if (user && user.id !== data.user_id) {
        recordPostView(postId)
      }
      
    } catch (err) {
      console.error('Error fetching post:', err)
      setError(err.message || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }
  
  // Record post view
  const recordPostView = async (pid) => {
    if (!user) return
    
    try {
      await supabase.from('post_views').upsert({
        post_id: pid,
        user_id: user.id,
        viewed_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error recording view:', err)
    }
  }

  // Handle poll vote
  const handlePollVote = async (optionIndex) => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    if (!post || !post.poll) return
    
    try {
      setInteractionLoading(true)
      
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('option_index')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()
      
      // Optimistic UI update
      const updatedPoll = { ...post.poll }
      
      // Initialize votes object if needed
      if (!updatedPoll.votes) updatedPoll.votes = {}
      
      // If user already voted, remove their previous vote
      if (existingVote) {
        const prevIndex = existingVote.option_index
        updatedPoll.votes[prevIndex] = Math.max(0, (updatedPoll.votes[prevIndex] || 1) - 1)
      }
      
      // Add new vote
      updatedPoll.votes[optionIndex] = (updatedPoll.votes[optionIndex] || 0) + 1
      
      // Update total votes
      updatedPoll.total_votes = Object.values(updatedPoll.votes).reduce((sum, count) => sum + count, 0)
      
      // Update post state
      setPost({
        ...post,
        poll: updatedPoll
      })
      
      setUserVote(optionIndex)
      
      // Send vote to server
      const { error } = await supabase
        .from('poll_votes')
        .upsert({
          post_id: postId,
          user_id: user.id,
          option_index: optionIndex,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error voting in poll:', err)
      // Revert optimistic update on error
      fetchPostData()
    } finally {
      setInteractionLoading(false)
    }
  }
  
  // Handle like toggle
  const handleLikeToggle = async () => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    if (interactionLoading) return
    
    try {
      setInteractionLoading(true)
      
      // Optimistic update
      const newLikedState = !isLiked
      setIsLiked(newLikedState)
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1)
      
      if (newLikedState) {
        // Like post
        const { error } = await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id
        })
        
        if (error) throw error
      } else {
        // Unlike post
        const { error } = await supabase.from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          
        if (error) throw error
      }
      
    } catch (err) {
      console.error('Error toggling like:', err)
      // Revert optimistic update
      setIsLiked(!isLiked)
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
    } finally {
      setInteractionLoading(false)
    }
  }
  
  // Handle save toggle
  const handleSaveToggle = async () => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    if (interactionLoading) return
    
    try {
      setInteractionLoading(true)
      
      // Optimistic update
      const newSavedState = !isSaved
      setIsSaved(newSavedState)
      
      if (newSavedState) {
        // Save post
        const { error } = await supabase.from('post_saves').insert({
          post_id: postId,
          user_id: user.id
        })
        
        if (error) throw error
      } else {
        // Unsave post
        const { error } = await supabase.from('post_saves')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          
        if (error) throw error
      }
      
    } catch (err) {
      console.error('Error toggling save:', err)
      // Revert optimistic update
      setIsSaved(!isSaved)
    } finally {
      setInteractionLoading(false)
    }
  }
  
  // Handle share
  const handleShare = () => {
    // Increment share count optimistically
    setShareCount(prev => prev + 1)
    
    if (navigator.share) {
      navigator.share({
        title: post.content?.substring(0, 50) || 'Check out this post',
        text: post.content?.substring(0, 100) || 'Check out this post',
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err)
        // Revert share count on error
        setShareCount(prev => prev - 1)
      })
    } else {
      // Fallback
      alert('Share URL copied to clipboard!')
      navigator.clipboard.writeText(window.location.href)
      
      // Update share count in database
      if (user) {
        supabase.rpc('increment_post_share_count', { post_id: postId })
          .catch(err => {
            console.error('Error incrementing share count:', err)
            // Revert share count on error
            setShareCount(prev => prev - 1)
          })
      }
    }
  }
  
  // Handle comment add
  const handleAddComment = async (content) => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    try {
      await addComment(content)
      // Update comment count optimistically
      setCommentCount(prev => prev + 1)
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }
  
  // Handle comment delete
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId)
      // Update comment count optimistically
      setCommentCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }
  
  // Handle reply to comment
  const handleReplyToComment = (comment) => {
    // This would normally focus the comment input and add a reference
    const commentInput = document.getElementById('comment-input')
    if (commentInput) {
      commentInput.focus()
      commentInput.value = `@${comment.profiles?.username || 'user'} `
    }
  }
  
  // Handle report
  const handleReport = () => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    // This would normally open a report dialog
    alert('Report functionality would open here')
  }
  
  // Prepare media array: preview video (if exists) first, then media_urls
  const getMediaArray = () => {
    const media = []
    
    if (!post) return media
    
    if (post.preview_video_url) {
      media.push({
        type: 'video',
        url: post.preview_video_url,
        thumbnail: '',
        isPreview: true,
        description: "Preview video"
      })
    }
    
    if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
      post.media_urls.forEach((url) => {
        // Guess type by extension
        const ext = url.split('.').pop().toLowerCase()
        media.push({
          type: ext === 'mp4' || ext === 'webm' ? 'video' : 'image',
          url,
          thumbnail: url,
          isPreview: false,
          description: `${post.user?.displayName || ''}'s post`
        })
      })
    }
    
    // If no media, create placeholder
    if (media.length === 0 && post.content) {
      return [] // No media, just text post
    }
    
    return media
  }
  
  // Check if current media is premium and should be locked
  const shouldLockCurrentMedia = () => {
    if (!post) return false
    
    const media = getMediaArray()
    const currentMedia = media[currentMediaIndex]
    
    // If post is premium and current media is not a preview, lock it
    return post.is_premium && currentMedia && !currentMedia.isPreview
  }
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <p className="text-gray-600 mb-6">
            The post you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }
  
  // If post data hasn't been fetched yet
  if (!post) {
    return null
  }
  
  // Get media array for display
  const media = getMediaArray()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="relative group">
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiMoreHorizontal className="text-xl" />
            </button>
            
            {/* Post options dropdown could go here */}
          </div>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto bg-white shadow-sm">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/user/${post.user.username}`} className="flex items-center space-x-3">
            <img
              src={post.user.avatar}
              alt={post.user.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold text-gray-900">{post.user.displayName}</h3>
                {post.user.isVerified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </p>
            </div>
          </Link>
          
          <div className="relative">
            <button
              onClick={() => {
                const menuOptions = [
                  { label: 'Report post', icon: FiFlag, action: handleReport },
                  // Additional options could go here
                ]
                // This would typically open a dropdown menu
                handleReport()
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiMoreHorizontal className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Media */}
        {media.length > 0 && (
          <div className="relative">
            {/* Premium Content Overlay */}
            {shouldLockCurrentMedia() && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center text-white">
                  <FiLock className="text-3xl mx-auto mb-2" />
                  <p className="font-semibold">Premium Content</p>
                  <p className="text-sm opacity-90">${post.price}</p>
                  <button 
                    className="mt-3 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (!user) {
                        navigate('/?auth=signin')
                      } else {
                        // Open purchase modal
                        alert('Premium content purchase would open here')
                      }
                    }}
                  >
                    Unlock for ${post.price}
                  </button>
                </div>
              </div>
            )}

            {/* Media Content */}
            <MediaCarousel
              media={media}
              currentIndex={currentMediaIndex}
              onIndexChange={setCurrentMediaIndex}
            />
          </div>
        )}

        {/* Post Content */}
        <div className="p-4">
          {post.content && (
            <p className="text-gray-900 leading-relaxed mb-3">{post.content}</p>
          )}
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-primary-500 text-sm hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Poll Display */}
          {post.poll && Object.keys(post.poll).length > 0 && (
            <div className="mt-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{post.poll.question}</h4>
                <div className="space-y-2">
                  {post.poll.options.map((option, index) => {
                    // Calculate percentage (default to 0)
                    const totalVotes = post.poll.total_votes || 0;
                    const optionVotes = post.poll.votes?.[index] || 0;
                    const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                    const isSelected = userVote === index;
                    
                    return (
                      <div key={index} className="relative">
                        <button 
                          className={`w-full text-left p-3 border rounded-lg transition-colors ${
                            isSelected 
                              ? 'bg-primary-50 border-primary-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => handlePollVote(index)}
                          disabled={interactionLoading}
                        >
                          <div className="flex justify-between items-center">
                            <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                            <span className="text-sm text-gray-500">{percentage}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div 
                            className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${
                              isSelected ? 'bg-primary-500' : 'bg-gray-300'
                            }`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Poll metadata */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center">
                    <FiBarChart2 className="mr-1" />
                    <span>{post.poll.total_votes || 0} votes</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="mr-1" />
                    <span>
                      {post.poll.duration === 1 
                        ? '1 day remaining' 
                        : `${post.poll.duration} days remaining`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Stats and Actions */}
          <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleLikeToggle}
                disabled={interactionLoading}
                className={`flex items-center space-x-1 ${
                  isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                } transition-colors`}
              >
                <FiHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition-colors"
                onClick={() => {
                  // Focus comment input
                  document.getElementById('comment-input')?.focus()
                }}
              >
                <FiMessageCircle className="text-xl" />
                <span className="font-medium">{commentCount}</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition-colors"
              >
                <FiShare className="text-xl" />
                <span className="font-medium">{shareCount}</span>
              </motion.button>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveToggle}
              disabled={interactionLoading}
              className={`${
                isSaved ? 'text-primary-500' : 'text-gray-700 hover:text-primary-500'
              } transition-colors`}
            >
              <FiBookmark className={`text-xl ${isSaved ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Post Stats */}
          <div className="py-3 text-sm text-gray-500 flex items-center space-x-1">
            <FiEye className="text-gray-400" />
            <span>{viewCount.toLocaleString()} views</span>
          </div>

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </h3>
            
            {/* Comment Input */}
            <div className="mb-6">
              <CommentForm
                id="comment-input"
                onSubmit={handleAddComment}
                submitting={submitting}
                placeholder="Add a comment..."
              />
            </div>
            
            {/* Comments List */}
            <CommentsList
              comments={comments}
              loading={commentsLoading}
              error={commentsError}
              onDeleteComment={handleDeleteComment}
              onReplyToComment={handleReplyToComment}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostView