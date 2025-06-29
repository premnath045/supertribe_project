import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'

/**
 * Custom hook for fetching posts feed with pagination
 */
export const usePostsFeed = (page = 0, options = {}) => {
  const { 
    postsApi,
    userId,
    getNextPageParam,
    onSuccess,
    onError,
    enabled = true,
    ...queryOptions
  } = options
  
  return useInfiniteQuery({
    queryKey: [...queryKeys.posts.feed(page), userId],
    queryFn: ({ pageParam = 0 }) => postsApi.getFeed(pageParam, 10, userId),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined
    },
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for fetching a single post by ID
 */
export const usePost = (postId, options = {}) => {
  const { 
    postsApi,
    userId,
    onSuccess,
    onError,
    enabled = !!postId,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: [...queryKeys.posts.detail(postId), userId],
    queryFn: () => postsApi.getPostById(postId, userId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for fetching post comments
 */
export const usePostComments = (postId, options = {}) => {
  const { 
    commentsApi,
    onSuccess,
    onError,
    enabled = !!postId,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: () => commentsApi.getComments(postId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for adding a comment to a post
 */
export const useAddComment = (postId, options = {}) => {
  const { 
    commentsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, content }) => 
      commentsApi.addComment(postId, userId, content),
    onSuccess: (newComment, variables, context) => {
      // Update comments cache
      queryClient.setQueryData(
        queryKeys.posts.comments(postId),
        (oldComments = []) => [...oldComments, newComment]
      )
      
      // Update post comment count
      queryClient.setQueryData(
        queryKeys.posts.detail(postId),
        (oldPost) => {
          if (!oldPost) return oldPost
          return {
            ...oldPost,
            comment_count: (oldPost.comment_count || 0) + 1
          }
        }
      )
      
      if (onSuccess) {
        onSuccess(newComment, variables, context)
      }
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Custom hook for deleting a comment
 */
export const useDeleteComment = (postId, options = {}) => {
  const { 
    commentsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, userId }) => 
      commentsApi.deleteComment(commentId, userId),
    onSuccess: (_, { commentId }, context) => {
      // Update comments cache
      queryClient.setQueryData(
        queryKeys.posts.comments(postId),
        (oldComments = []) => oldComments.filter(comment => comment.id !== commentId)
      )
      
      // Update post comment count
      queryClient.setQueryData(
        queryKeys.posts.detail(postId),
        (oldPost) => {
          if (!oldPost) return oldPost
          return {
            ...oldPost,
            comment_count: Math.max(0, (oldPost.comment_count || 0) - 1)
          }
        }
      )
      
      if (onSuccess) {
        onSuccess(_, { commentId }, context)
      }
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Custom hook for fetching poll votes
 */
export const usePollVotes = (postId, options = {}) => {
  const { 
    pollsApi,
    userId,
    onSuccess,
    onError,
    enabled = !!postId,
    ...queryOptions
  } = options
  
  // Fetch all votes for the poll
  const votesQuery = useQuery({
    queryKey: queryKeys.posts.poll(postId),
    queryFn: () => pollsApi.getVotes(postId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
  
  // Fetch the current user's vote
  const userVoteQuery = useQuery({
    queryKey: [...queryKeys.posts.poll(postId), 'userVote', userId],
    queryFn: () => pollsApi.getUserVote(postId, userId),
    enabled: enabled && !!userId,
    ...queryOptions
  })
  
  // Process vote counts
  const voteCount = {}
  const totalVotes = votesQuery.data?.length || 0
  
  if (votesQuery.data) {
    votesQuery.data.forEach(vote => {
      const { option_index } = vote
      voteCount[option_index] = (voteCount[option_index] || 0) + 1
    })
  }
  
  // Calculate percentages
  const percentages = {}
  if (totalVotes > 0) {
    Object.entries(voteCount).forEach(([optionIndex, count]) => {
      percentages[optionIndex] = Math.round((count / totalVotes) * 100)
    })
  }
  
  return {
    voteCount,
    totalVotes,
    percentages,
    userVote: userVoteQuery.data,
    isLoading: votesQuery.isLoading || userVoteQuery.isLoading,
    isError: votesQuery.isError || userVoteQuery.isError,
    error: votesQuery.error || userVoteQuery.error,
    refetch: () => {
      votesQuery.refetch()
      if (userId) userVoteQuery.refetch()
    }
  }
}

/**
 * Custom hook for submitting a poll vote
 */
export const useSubmitPollVote = (postId, options = {}) => {
  const { 
    pollsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, optionIndex }) => 
      pollsApi.submitVote(postId, userId, optionIndex),
    onSuccess: (_, { userId, optionIndex }, context) => {
      // Invalidate poll votes query to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.poll(postId) })
      
      if (onSuccess) {
        onSuccess(_, { userId, optionIndex }, context)
      }
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Custom hook for liking/unliking a post
 */
export const usePostLike = (postId, options = {}) => {
  const { 
    postsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, isLiked }) => 
      isLiked 
        ? postsApi.unlikePost(postId, userId) 
        : postsApi.likePost(postId, userId),
    onMutate: async ({ userId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.feed() })
      
      // Snapshot the previous value
      const previousPost = queryClient.getQueryData(queryKeys.posts.detail(postId))
      const previousFeedData = queryClient.getQueryData(queryKeys.posts.feed())
      
      // Optimistically update the post
      queryClient.setQueryData(
        queryKeys.posts.detail(postId),
        (oldPost) => {
          if (!oldPost) return oldPost
          return {
            ...oldPost,
            like_count: isLiked 
              ? Math.max(0, (oldPost.like_count || 0) - 1)
              : (oldPost.like_count || 0) + 1
          }
        }
      )
      
      // Update in the infinite query feed if present
      queryClient.setQueryData(
        queryKeys.posts.feed(),
        (oldData) => {
          if (!oldData?.pages) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => 
              page.map(post => 
                post.id === postId 
                  ? {
                      ...post,
                      like_count: isLiked 
                        ? Math.max(0, (post.like_count || 0) - 1)
                        : (post.like_count || 0) + 1
                    }
                  : post
              )
            )
          }
        }
      )
      
      return { previousPost, previousFeedData }
    },
    onError: (err, { isLiked }, context) => {
      // Revert to the previous value if there was an error
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.posts.detail(postId),
          context.previousPost
        )
      }
      
      if (context?.previousFeedData) {
        queryClient.setQueryData(
          queryKeys.posts.feed(),
          context.previousFeedData
        )
      }
      
      if (onError) {
        onError(err, { isLiked }, context)
      }
    },
    onSuccess: (_, { userId, isLiked }, context) => {
      // Invalidate related queries to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() })
      
      if (onSuccess) {
        onSuccess(_, { userId, isLiked }, context)
      }
    },
    ...mutationOptions
  })
}

/**
 * Custom hook for saving/unsaving a post
 */
export const usePostSave = (postId, options = {}) => {
  const { 
    postsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, isSaved }) => 
      isSaved 
        ? postsApi.unsavePost(postId, userId) 
        : postsApi.savePost(postId, userId),
    onMutate: async ({ userId, isSaved }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.feed() })
      await queryClient.cancelQueries({ queryKey: queryKeys.user.saved(userId) })
      
      // Snapshot the previous values
      const previousPost = queryClient.getQueryData(queryKeys.posts.detail(postId))
      const previousFeedData = queryClient.getQueryData(queryKeys.posts.feed())
      const previousSavedData = queryClient.getQueryData(queryKeys.user.saved(userId))
      
      // Optimistically update the post detail
      queryClient.setQueryData(
        queryKeys.posts.detail(postId),
        (oldPost) => {
          if (!oldPost) return oldPost
          return {
            ...oldPost,
            isSaved: !isSaved
          }
        }
      )
      
      // Update in the infinite query feed if present
      queryClient.setQueryData(
        queryKeys.posts.feed(),
        (oldData) => {
          if (!oldData?.pages) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => 
              page.map(post => 
                post.id === postId 
                  ? { ...post, isSaved: !isSaved }
                  : post
              )
            )
          }
        }
      )
      
      return { previousPost, previousFeedData, previousSavedData }
    },
    onError: (err, { userId, isSaved }, context) => {
      // Revert optimistic updates on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.posts.detail(postId),
          context.previousPost
        )
      }
      
      if (context?.previousFeedData) {
        queryClient.setQueryData(
          queryKeys.posts.feed(),
          context.previousFeedData
        )
      }
      
      if (context?.previousSavedData) {
        queryClient.setQueryData(
          queryKeys.user.saved(userId),
          context.previousSavedData
        )
      }
      
      if (onError) {
        onError(err, { userId, isSaved }, context)
      }
    },
    onSuccess: (_, { userId, isSaved }, context) => {
      // Invalidate user's saved posts
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.saved(userId) })
      }
      
      // Invalidate related queries to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() })
      
      if (onSuccess) {
        onSuccess(_, { userId, isSaved }, context)
      }
    },
    ...mutationOptions
  })
}

/**
 * Custom hook for fetching user profile
 */
export const useUserProfile = (username, options = {}) => {
  const { 
    profilesApi,
    onSuccess,
    onError,
    enabled = !!username,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => profilesApi.getProfile(username),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for following/unfollowing a user
 */
export const useFollowUser = (profileId, options = {}) => {
  const { 
    profilesApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ followerId, isFollowing }) => 
      isFollowing 
        ? profilesApi.unfollowUser(followerId, profileId) 
        : profilesApi.followUser(followerId, profileId),
    onMutate: async ({ followerId, isFollowing }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', profileId, 'followers'] })
      await queryClient.cancelQueries({ queryKey: ['profile', followerId, 'following'] })
      
      // Return context with the previous values
      return { isFollowing }
    },
    onError: (err, { isFollowing }, context) => {
      // We could revert optimistic updates here if needed
      if (onError) {
        onError(err, { isFollowing }, context)
      }
    },
    onSuccess: (_, { followerId, isFollowing }, context) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile', profileId, 'followers'] })
      queryClient.invalidateQueries({ queryKey: ['profile', followerId, 'following'] })
      
      if (onSuccess) {
        onSuccess(_, { followerId, isFollowing }, context)
      }
    },
    ...mutationOptions
  })
}

/**
 * Custom hook for fetching notifications with pagination
 */
export const useNotifications = (userId, options = {}) => {
  const { 
    notificationsApi,
    limit = 20,
    onSuccess,
    onError,
    enabled = !!userId,
    ...queryOptions
  } = options
  
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ pageParam = 0 }) => notificationsApi.getNotifications(userId, pageParam, limit),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined
    },
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for fetching unread notification count
 */
export const useUnreadNotificationCount = (userId, options = {}) => {
  const { 
    notificationsApi,
    onSuccess,
    onError,
    enabled = !!userId,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => notificationsApi.getUnreadCount(userId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for marking a notification as read
 */
export const useMarkNotificationAsRead = (options = {}) => {
  const { 
    notificationsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ notificationId, userId }) => 
      notificationsApi.markAsRead(notificationId, userId),
    onSuccess: (_, { notificationId, userId }, context) => {
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread })
      
      // Update notifications in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => 
              page.map(notification => 
                notification.id === notificationId 
                  ? { ...notification, is_read: true }
                  : notification
              )
            )
          }
        }
      )
      
      if (onSuccess) {
        onSuccess(_, { notificationId, userId }, context)
      }
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Custom hook for marking all notifications as read
 */
export const useMarkAllNotificationsAsRead = (userId, options = {}) => {
  const { 
    notificationsApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId),
    onSuccess: (_, variables, context) => {
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread })
      
      // Update notifications in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            pages: oldData.pages.map(page => 
              page.map(notification => ({ ...notification, is_read: true }))
            )
          }
        }
      )
      
      if (onSuccess) {
        onSuccess(_, variables, context)
      }
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Custom hook for fetching discovery data
 */
export const useDiscoveryData = (options = {}) => {
  const { 
    discoveryApi,
    onSuccess,
    onError,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.discovery.all,
    queryFn: () => discoveryApi.getDiscoveryData(),
    onSuccess,
    onError,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...queryOptions
  })
}

/**
 * Custom hook for searching creators
 */
export const useCreatorSearch = (searchQuery, options = {}) => {
  const { 
    discoveryApi,
    onSuccess,
    onError,
    enabled = searchQuery.length >= 2,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.discovery.search(searchQuery),
    queryFn: () => discoveryApi.getSuggestedCreators({ 
      searchQuery, 
      limit: options.limit || 20 
    }),
    onSuccess,
    onError,
    enabled,
    staleTime: 1000 * 60, // 1 minute
    ...queryOptions
  })
}

/**
 * Custom hook for fetching conversations
 */
export const useConversations = (userId, options = {}) => {
  const { 
    messagesApi,
    onSuccess,
    onError,
    enabled = !!userId,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: () => messagesApi.getConversations(userId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for fetching messages in a conversation
 */
export const useConversationMessages = (conversationId, options = {}) => {
  const { 
    messagesApi,
    onSuccess,
    onError,
    enabled = !!conversationId,
    ...queryOptions
  } = options
  
  return useQuery({
    queryKey: queryKeys.conversations.messages(conversationId),
    queryFn: () => messagesApi.getMessages(conversationId),
    onSuccess,
    onError,
    enabled,
    ...queryOptions
  })
}

/**
 * Custom hook for sending a message
 */
export const useSendMessage = (conversationId, options = {}) => {
  const { 
    messagesApi,
    onSuccess,
    onError,
    ...mutationOptions
  } = options
  
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, content, messageType, mediaUrl, replyToId }) => 
      messagesApi.sendMessage(conversationId, userId, content, messageType, mediaUrl, replyToId),
    onSuccess: (newMessage, variables, context) => {
      // Update messages in cache
      queryClient.setQueryData(
        queryKeys.conversations.messages(conversationId),
        (oldMessages = []) => [...oldMessages, newMessage]
      )
      
      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all })
      
      if (onSuccess) {
        onSuccess(newMessage, variables, context)
      }
    },
    onError,
    ...mutationOptions
  })
}