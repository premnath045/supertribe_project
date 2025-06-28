import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Debounce function to limit frequency of function calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const usePresence = () => {
  const { user } = useAuth()
  const [userPresence, setUserPresence] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const presenceIntervalRef = useRef(null)
  const subscriptionRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const presenceCacheRef = useRef({})
  const lastUpdateRef = useRef({})

  // Fetch presence data for a list of user IDs
  const fetchPresence = useCallback(async (userIds) => {
    if (!userIds || !userIds.length || !user) return
    
    // Filter out user IDs that were recently fetched (within last 30 seconds)
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    
    const staleUserIds = userIds.filter(id => {
      const lastUpdate = lastUpdateRef.current[id] || 0;
      return now - lastUpdate > staleThreshold;
    });
    
    // If no stale user IDs, use cached data
    if (staleUserIds.length === 0) {
      return;
    }

    try {
      if (Object.keys(presenceCacheRef.current).length === 0) {
        setLoading(true);
      }
      setError(null)

      // Use the batch function to get presence data
      const { data, error } = await supabase.rpc(
        'get_user_presence_batch',
        { user_ids: staleUserIds }
      );

      if (error) throw error

      // Update cache with new data
      const newPresenceData = { ...presenceCacheRef.current };
      
      data.forEach((presence) => {
        newPresenceData[presence.user_id] = {
          status: presence.status,
          lastSeen: new Date(presence.last_seen_at),
          typingInConversation: presence.typing_in_conversation
        };
        
        // Update last fetch time
        lastUpdateRef.current[presence.user_id] = now;
      });

      presenceCacheRef.current = newPresenceData;
      setUserPresence(newPresenceData);
      
    } catch (err) {
      console.error('Error fetching presence data:', err)
      setError('Failed to load presence data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update current user's presence
  const updatePresence = debounce(async (status = 'online') => {
    if (!user) return
    
    // Don't update if status hasn't changed
    const currentStatus = presenceCacheRef.current[user.id]?.status;
    if (currentStatus === status) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (err) {
      console.error('Error updating presence:', err)
    }
  }, 5000) // Debounce presence updates to reduce database calls

  // Set typing indicator
  const setTypingIndicator = debounce(async (conversationId) => {
    if (!user || !conversationId) return

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_seen_at: new Date().toISOString(),
          typing_in_conversation: conversationId,
          updated_at: new Date().toISOString()
        })

      // Clear typing indicator after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(async () => {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            typing_in_conversation: null,
            updated_at: new Date().toISOString()
          })
      }, 3000)
    } catch (err) {
      console.error('Error setting typing indicator:', err)
    }
  }, 2000) // Debounce typing indicator to reduce database calls

  // Clear typing indicator
  const clearTypingIndicator = useCallback(async () => {
    if (!user) return

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          typing_in_conversation: null,
          updated_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Error clearing typing indicator:', err)
    }
  }, [user])

  // Check if a user is typing in a specific conversation
  const isUserTyping = useCallback((userId, conversationId) => {
    if (!userId || !conversationId) return false

    const presence = userPresence[userId]
    return presence && presence.typingInConversation === conversationId
  }, [userPresence])

  // Get a user's status
  const getUserStatus = useCallback((userId) => {
    if (!userId) return 'offline'

    const presence = userPresence[userId]
    if (!presence) return 'offline'

    // If last seen is more than 5 minutes ago, consider offline
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (presence.lastSeen < fiveMinutesAgo) return 'offline'

    return presence.status
  }, [userPresence])

  // Set up presence tracking and subscription
  useEffect(() => {
    if (!user) return

    // Initial presence update
    updatePresence('online')

    // Set up interval to update presence every minute
    presenceIntervalRef.current = setInterval(() => {
      // Only update presence if document is visible
      if (document.visibilityState === 'visible') {
        updatePresence('online');
      } else {
        updatePresence('away');
      }
    }, 300000) // Update every 5 minutes instead of every minute
    
    // Don't subscribe to all presence changes, just poll for specific users
    // This significantly reduces the number of realtime subscriptions

    // Set up window events for presence
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence('online')
      } else {
        updatePresence('away')
      }
    }

    const handleBeforeUnload = () => {
      // Synchronous call to update status to offline
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence`,
        JSON.stringify({
          user_id: user.id,
          status: 'offline',
          last_seen_at: new Date().toISOString(),
          typing_in_conversation: null,
          updated_at: new Date().toISOString()
        })
      )
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Update status to offline when component unmounts
      updatePresence('offline')
    }
  }, [user, updatePresence])

  return {
    userPresence,
    loading,
    error,
    fetchPresence,
    updatePresence,
    setTypingIndicator,
    clearTypingIndicator,
    isUserTyping,
    getUserStatus
  }
}