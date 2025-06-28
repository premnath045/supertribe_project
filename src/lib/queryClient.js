import { supabase } from './supabase'

/**
 * Query key factory for consistent key management
 */
export const queryKeys = {
  // User related queries
  user: {
    profile: (userId) => ['user', 'profile', userId],
    followers: (userId) => ['user', 'followers', userId],
    following: (userId) => ['user', 'following', userId],
    posts: (userId) => ['user', 'posts', userId],
    saved: (userId) => ['user', 'saved', userId],
    liked: (userId) => ['user', 'liked', userId],
    highlights: (userId) => ['user', 'highlights', userId],
    stories: (userId) => ['user', 'stories', userId]
  },
  
  // Post related queries
  posts: {
    all: ['posts'],
    feed: (page) => ['posts', 'feed', page],
    detail: (postId) => ['posts', 'detail', postId],
    comments: (postId) => ['posts', 'comments', postId],
    likes: (postId) => ['posts', 'likes', postId],
    poll: (postId) => ['posts', 'poll', postId],
    scheduled: (userId) => ['posts', 'scheduled', userId]
  },
  
  // Story related queries
  stories: {
    all: ['stories'],
    active: ['stories', 'active'],
    user: (userId) => ['stories', 'user', userId],
    highlight: (highlightId) => ['stories', 'highlight', highlightId]
  },
  
  // Conversation related queries
  conversations: {
    all: ['conversations'],
    detail: (conversationId) => ['conversations', 'detail', conversationId],
    messages: (conversationId) => ['conversations', 'messages', conversationId]
  },
  
  // Notification related queries
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread']
  },
  
  // Discovery related queries
  discovery: {
    all: ['discovery'],
    categories: ['discovery', 'categories'],
    trending: ['discovery', 'trending'],
    creators: (categoryId) => ['discovery', 'creators', categoryId],
    search: (query) => ['discovery', 'search', query]
  }
}

/**
 * API functions for posts
 */
export const postsApi = {
  getFeed: async (page = 0, limit = 10) => {
    const { data, error } = await supabase
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
      .range(page * limit, (page + 1) * limit - 1)
    
    if (error) throw error
    return data
  },
  
  getPostById: async (postId) => {
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
    
    if (error) throw error
    return data
  },
  
  getUserPosts: async (userId) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
  
  createPost: async (postData) => {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  likePost: async (postId, userId) => {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId })
    
    if (error) throw error
    return true
  },
  
  unlikePost: async (postId, userId) => {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  },
  
  savePost: async (postId, userId) => {
    const { error } = await supabase
      .from('post_saves')
      .insert({ post_id: postId, user_id: userId })
    
    if (error) throw error
    return true
  },
  
  unsavePost: async (postId, userId) => {
    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  },
  
  checkPostInteractions: async (postId, userId) => {
    if (!userId) return { isLiked: false, isSaved: false }
    
    const [likeResponse, saveResponse] = await Promise.all([
      supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single(),
      
      supabase
        .from('post_saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()
    ])
    
    return {
      isLiked: !likeResponse.error,
      isSaved: !saveResponse.error
    }
  }
}

/**
 * API functions for comments
 */
export const commentsApi = {
  getComments: async (postId) => {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },
  
  addComment: async (postId, userId, content) => {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },
  
  deleteComment: async (commentId, userId) => {
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  }
}

/**
 * API functions for polls
 */
export const pollsApi = {
  getVotes: async (postId) => {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('post_id', postId)
    
    if (error) throw error
    return data
  },
  
  getUserVote: async (postId, userId) => {
    if (!userId) return null
    
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No vote found
      throw error
    }
    
    return data.option_index
  },
  
  submitVote: async (postId, userId, optionIndex) => {
    const { error } = await supabase
      .from('poll_votes')
      .upsert({
        post_id: postId,
        user_id: userId,
        option_index: optionIndex,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    return true
  }
}

/**
 * API functions for user profiles
 */
export const profilesApi = {
  getProfile: async (username) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) throw error
    return data
  },
  
  getProfileById: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },
  
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  getFollowers: async (userId) => {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        follower_id,
        profiles!follower_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('following_id', userId)
    
    if (error) throw error
    return data.map(item => item.profiles).filter(Boolean)
  },
  
  getFollowing: async (userId) => {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        following_id,
        profiles!following_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('follower_id', userId)
    
    if (error) throw error
    return data.map(item => item.profiles).filter(Boolean)
  },
  
  followUser: async (followerId, followingId) => {
    const { error } = await supabase
      .from('followers')
      .insert({ 
        follower_id: followerId,
        following_id: followingId
      })
    
    if (error) throw error
    return true
  },
  
  unfollowUser: async (followerId, followingId) => {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
    
    if (error) throw error
    return true
  },
  
  checkFollowStatus: async (followerId, followingId) => {
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return false // Not following
      throw error
    }
    
    return true
  }
}

/**
 * API functions for stories
 */
export const storiesApi = {
  getActiveStories: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles!creator_id (
          username,
          display_name,
          avatar_url,
          is_verified,
          user_type
        )
      `)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  getUserStories: async (userId) => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  createStory: async (storyData) => {
    const { data, error } = await supabase
      .from('stories')
      .insert([storyData])
      .select(`
        *,
        profiles!creator_id (
          username,
          display_name,
          avatar_url,
          is_verified,
          user_type
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },
  
  markStoryAsViewed: async (storyId, viewerId) => {
    const { error } = await supabase
      .from('story_views')
      .insert([{
        story_id: storyId,
        viewer_id: viewerId
      }])
      .onConflict(['story_id', 'viewer_id'])
      .ignore()
    
    if (error && error.code !== '23505') throw error // Ignore unique constraint violations
    return true
  }
}

/**
 * API functions for notifications
 */
export const notificationsApi = {
  getNotifications: async (userId, page = 0, limit = 20) => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender_profile:sender_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)
    
    if (error) throw error
    
    // Map sender_profile to sender for compatibility
    return (data || []).map(n => ({
      ...n,
      sender: n.sender_profile,
    }))
  },
  
  getUnreadCount: async (userId) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
    return count || 0
  },
  
  markAsRead: async (notificationId, userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
    
    if (error) throw error
    return true
  },
  
  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .rpc('mark_all_notifications_read', { user_id: userId })
    
    if (error) throw error
    return true
  },
  
  deleteNotification: async (notificationId, userId) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId)
    
    if (error) throw error
    return true
  }
}

/**
 * API functions for conversations and messages
 */
export const messagesApi = {
  getConversations: async (userId) => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations!inner (
          id,
          type,
          name,
          avatar_url,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('conversations(updated_at)', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  getMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        reply_to:reply_to_id (
          id,
          content,
          profiles:sender_id (
            display_name
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },
  
  sendMessage: async (conversationId, userId, content, messageType = 'text', mediaUrl = null, replyToId = null) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        message_type: messageType,
        media_url: mediaUrl,
        reply_to_id: replyToId
      })
      .select(`
        *,
        profiles:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        reply_to:reply_to_id (
          id,
          content,
          profiles:profiles!sender_id (
            display_name
          )
        )
      `)
      .single()
    
    if (error) throw error
    return data
  },
  
  editMessage: async (messageId, userId, newContent) => {
    const { error } = await supabase
      .from('messages')
      .update({
        content: newContent.trim(),
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', userId)
    
    if (error) throw error
    return true
  },
  
  deleteMessage: async (messageId, userId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId)
    
    if (error) throw error
    return true
  },
  
  markConversationAsRead: async (conversationId, userId) => {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  }
}

/**
 * API functions for discovery
 */
export const discoveryApi = {
  getDiscoveryData: async () => {
    const { data, error } = await supabase.rpc('get_discovery_data')
    
    if (error) throw error
    return data
  },
  
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        icon,
        slug,
        profile_categories!inner(
          profiles!inner(
            id,
            user_type,
            is_verified
          )
        )
      `)
      .eq('is_active', true)
      .eq('profile_categories.profiles.user_type', 'creator')
      .eq('profile_categories.profiles.is_verified', true)
      .order('sort_order')
    
    if (error) throw error
    
    return data.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      slug: category.slug,
      creator_count: category.profile_categories?.length || 0
    }))
  },
  
  getTrendingHashtags: async (limit = 10) => {
    const { data, error } = await supabase
      .from('hashtags')
      .select('tag, usage_count, trending_score')
      .gt('usage_count', 0)
      .order('trending_score', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
  
  getSuggestedCreators: async (options = {}) => {
    const {
      limit = 20,
      categorySlug = null,
      searchQuery = null,
      excludeUserIds = []
    } = options
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        is_verified,
        user_type,
        created_at,
        profile_categories!left(
          categories!inner(
            id,
            name,
            icon,
            slug
          )
        )
      `)
      .eq('user_type', 'creator')
      .eq('is_verified', true)
      .not('username', 'is', null)
      .not('display_name', 'is', null)
    
    if (categorySlug) {
      query = query.eq('profile_categories.categories.slug', categorySlug)
    }
    
    if (searchQuery) {
      const searchTerm = `%${searchQuery.toLowerCase()}%`
      query = query.or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
    }
    
    if (excludeUserIds.length > 0) {
      query = query.not('id', 'in', `(${excludeUserIds.join(',')})`)
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data.map(creator => ({
      id: creator.id,
      username: creator.username,
      displayName: creator.display_name,
      bio: creator.bio,
      avatar: creator.avatar_url,
      isVerified: creator.is_verified,
      userType: creator.user_type,
      categories: creator.profile_categories?.map(pc => pc.categories).filter(Boolean) || []
    }))
  }
}