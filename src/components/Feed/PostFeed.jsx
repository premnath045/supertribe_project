import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import PostCard from './PostCard'
import LoadingSpinner from '../UI/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function PostFeed({ onPostClick, onShareClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [visiblePosts, setVisiblePosts] = useState(new Set())
  
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.1,
  })

  // Intersection Observer for tracking visible posts
  const postRefs = useRef({})
  const observer = useRef(null)

  useEffect(() => {
    // Create intersection observer for video auto-play
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.dataset.postId
          if (postId) {
            setVisiblePosts(prev => {
              const newSet = new Set(prev)
              if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                // Post is more than 50% visible
                newSet.add(postId)
              } else {
                // Post is less than 50% visible
                newSet.delete(postId)
              }
              return newSet
            })
          }
        })
      },
      {
        threshold: [0.5], // Trigger when 50% of the post is visible
        rootMargin: '-10% 0px -10% 0px' // Add some margin for better UX
      }
    )

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  // Function to register post refs with observer
  const registerPostRef = (postId, element) => {
    if (element) {
      postRefs.current[postId] = element
      element.dataset.postId = postId
      if (observer.current) {
        observer.current.observe(element)
      }
    } else {
      // Cleanup when component unmounts
      if (postRefs.current[postId] && observer.current) {
        observer.current.unobserve(postRefs.current[postId])
        delete postRefs.current[postId]
      }
    }
  }
  
  // Navigate to post detail page
  const handlePostClick = (post) => {
    if (onPostClick) {
      onPostClick(post)
    } else if (post && post.id) {
      navigate(`/post/${post.id}`)
    }
  }

  // Handle share functionality
  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user?.displayName}'s post`,
          text: post.content || 'Check out this post!',
          url: `${window.location.origin}/post/${post.id}`
        })
      } catch (err) {
        console.log('Share cancelled or failed:', err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
        // You could show a toast notification here
        console.log('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy link:', err)
      }
    }
  }

  // Handle poll vote - simplified to use the usePollVotes hook
  const handlePollVote = async (postId, optionIndex) => {
    if (!user) {
      navigate('/?auth=signin')
      return
    }
    
    console.log(`User ${user.id} voted for option ${optionIndex} in poll ${postId}`)
  }

  const POSTS_PER_PAGE = 10

  // Fetch posts from Supabase
  const fetchPosts = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      console.log('🔍 Fetching posts from Supabase...', { pageNum, append })

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          media_urls,
          is_premium,
          price,
          subscriber_discount,
          tags,
          poll,
          preview_video_url,
          scheduled_for,
          status,
          like_count,
          comment_count,
          share_count,
          view_count,
          created_at,
          updated_at,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified,
            user_type
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1)

      if (postsError) {
        console.error('❌ Error fetching posts:', postsError)
        throw postsError
      }

      // Get post IDs for like/save status
      const postIds = postsData.map(post => post.id)
      let likedIds = []
      let savedIds = []
      
      if (user && postIds.length > 0) {
        // Fetch likes
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id)
        likedIds = likesData ? likesData.map(l => l.post_id) : []
        // Fetch saves
        const { data: savesData } = await supabase
          .from('post_saves')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id)
        savedIds = savesData ? savesData.map(s => s.post_id) : []
      }

      // Transform data to match expected format
      const transformedPosts = postsData.map(post => ({
        ...post,
        user: {
          id: post.user_id,
          username: post.profiles?.username || 'unknown',
          displayName: post.profiles?.display_name || 'Unknown User',
          avatar: post.profiles?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          isVerified: post.profiles?.is_verified || false,
          isPremium: post.profiles?.user_type === 'creator' && post.profiles?.is_verified
        },
        media: post.media_urls ? post.media_urls.map(url => ({
          type: 'image',
          url: url,
          thumbnail: url
        })) : [],
        likeCount: post.like_count || 0,
        commentCount: post.comment_count || 0,
        shareCount: post.share_count || 0,
        isLiked: likedIds.includes(post.id),
        isSaved: savedIds.includes(post.id),
        createdAt: new Date(post.created_at),
        tags: post.tags || []
      }))

      if (append) {
        setPosts(prev => [...prev, ...transformedPosts])
      } else {
        setPosts(transformedPosts)
      }

      setHasMore(transformedPosts.length === POSTS_PER_PAGE)
      
    } catch (error) {
      console.error('❌ Error in fetchPosts:', error)
      setError(error.message || 'Failed to load posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchPosts(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll
  useEffect(() => {
    if (loadMoreInView && hasMore && !loading && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreInView, hasMore, loading, loadingMore, page])

  const handlePostInteraction = async (postId, action) => {
    if (!user) return;
    
    // Optimistic UI update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        switch (action) {
          case 'like': {
            const optimistic = !post.isLiked;
            return {
              ...post,
              isLiked: optimistic,
              likeCount: optimistic ? post.likeCount + 1 : post.likeCount - 1
            }
          }
          case 'save': {
            return { ...post, isSaved: !post.isSaved }
          }
          default:
            return post
        }
      }
      return post
    }))

    // Supabase update with error handling
    try {
      if (action === 'like') {
        const currentPost = posts.find(p => p.id === postId);
        const wasLiked = currentPost?.isLiked;
        
        if (!wasLiked) {
          // Like (insert)
          const { error } = await supabase
            .from('post_likes')
            .insert({ 
              post_id: postId, 
              user_id: user.id,
              created_at: new Date().toISOString()
            })
          
          if (error) throw error;
          
          // Update post like count in database
          await supabase
            .from('posts')
            .update({ like_count: (currentPost?.likeCount || 0) + 1 })
            .eq('id', postId)
            
        } else {
          // Unlike (delete)
          const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)
          
          if (error) throw error;
          
          // Update post like count in database
          await supabase
            .from('posts')
            .update({ like_count: Math.max(0, (currentPost?.likeCount || 1) - 1) })
            .eq('id', postId)
        }
      }
      
      if (action === 'save') {
        const currentPost = posts.find(p => p.id === postId);
        const wasSaved = currentPost?.isSaved;
        
        if (!wasSaved) {
          // Save (insert)
          const { error } = await supabase
            .from('post_saves')
            .insert({ 
              post_id: postId, 
              user_id: user.id,
              created_at: new Date().toISOString()
            })
          
          if (error) throw error;
        } else {
          // Unsave (delete)
          const { error } = await supabase
            .from('post_saves')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)
          
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('❌ Error in post interaction:', error);
      
      // Revert optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          switch (action) {
            case 'like': {
              const revert = post.isLiked;
              return {
                ...post,
                isLiked: !revert,
                likeCount: revert ? post.likeCount - 1 : post.likeCount + 1
              }
            }
            case 'save': {
              return { ...post, isSaved: !post.isSaved }
            }
            default:
              return post
          }
        }
        return post
      }))
    }
  }

  // Skeleton loader component
  const SkeletonPost = () => (
    <div className="bg-white shadow-sm border border-gray-200 mb-6 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center space-x-3 p-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      
      {/* Media skeleton */}
      <div className="aspect-square bg-gray-200"></div>
      
      {/* Actions skeleton */}
      <div className="p-3">
        <div className="flex items-center space-x-4 mb-2">
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load posts
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchPosts(0, false)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-0 pb-8">
      {/* Loading skeleton for initial load */}
      {loading && posts.length === 0 && (
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonPost key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Posts */}
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          ref={(el) => registerPostRef(post.id, el)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="post-container"
        >
          <PostCard
            post={post}
            isInView={visiblePosts.has(post.id)}
            onLike={() => handlePostInteraction(post.id, 'like')}
            onSave={() => handlePostInteraction(post.id, 'save')}
            onComment={() => handlePostClick(post)}
            onShare={() => onShareClick ? onShareClick(post) : handleShare(post)}
            onPollVote={handlePollVote}
            onClick={() => handlePostClick(post)}
          />
        </motion.div>
      ))}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="space-y-0">
          {Array.from({ length: 2 }).map((_, index) => (
            <SkeletonPost key={`loading-skeleton-${index}`} />
          ))}
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-500 text-center text-sm">
            You've reached the end! 🎉
          </p>
        )}
      </div>

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600">
            Be the first to share something amazing!
          </p>
        </div>
      )}
    </div>
  )
}

export default PostFeed