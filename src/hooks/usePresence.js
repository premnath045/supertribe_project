import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const usePresence = () => {
  const { user } = useAuth()
  const [userPresence, setUserPresence] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const presenceIntervalRef = useRef(null)
  const subscriptionRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Fetch presence data for a list of user IDs
  const fetchPresence = useCallback(async (userIds) => {
    if (!userIds || !userIds.length) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)

      if (error) throw error

      const presenceMap = {}
      data.forEach(presence => {
        presenceMap[presence.user_id] = {
          status: presence.status,
          lastSeen: new Date(presence.last_seen_at),
          typingInConversation: presence.typing_in_conversation
        }
      })

      setUserPresence(presenceMap)
    } catch (err) {
      console.error('Error fetching presence data:', err)
      setError('Failed to load presence data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update current user's presence
  const updatePresence = useCallback(async (status = 'online') => {
    if (!user) return

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
  }, [user])

  // Set typing indicator
  const setTypingIndicator = useCallback(async (conversationId) => {
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
  }, [user])

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
      updatePresence('online')
    }, 60000)

    // Subscribe to presence changes
    const subscription = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.new) {
            setUserPresence(prev => ({
              ...prev,
              [payload.new.user_id]: {
                status: payload.new.status,
                lastSeen: new Date(payload.new.last_seen_at),
                typingInConversation: payload.new.typing_in_conversation
              }
            }))
          }
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

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