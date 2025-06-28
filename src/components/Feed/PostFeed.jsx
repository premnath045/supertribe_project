import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import PostCard from '../PostCard'
import LoadingSpinner from '../UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usePostsFeed } from '../../hooks/useTanstackQuery'
import { postsApi } from '../../lib/queryClient'

function PostFeed({ onPostClick, onShareClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [visiblePosts, setVisiblePosts] = useState(new Set())
  
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.1,
  })

  // Use TanStack Query for posts feed
  const { 
    data: posts = [], 
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    error,
    hasNextPage: hasMore,
    fetchNextPage
  } = usePostsFeed(page, {
    postsApi,
    enabled: true,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined
    }
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
  
  // Infinite scroll
  // Navigate to post detail page
  const handlePostClick = (post) => {
    if (onPostClick) {
      onPostClick(post)
    } else if (post && post.id) {
      navigate(`/post/${post.id}`)
    }
  }
  
  // Load more posts when scrolling to the bottom
  if (loadMoreInView && hasMore && !loading && !loadingMore) {
    fetchNextPage()
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

  // Flatten posts from all pages
  const flattenedPosts = posts?.pages?.flatMap(page => page) || []

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
      {flattenedPosts.length > 0 && flattenedPosts.map((post, index) => (
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
            onComment={() => handlePostClick(post)}
            onShare={() => onShareClick && onShareClick(post)}
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
      {!loading && !loadingMore && flattenedPosts.length === 0 && !error && (
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