import React, { useState, useEffect, useCallback, useRef } from 'react'
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

export const useNotifications = (options = {}) => {
  const { 
    limit = 10, 
    fetchOnMount = true,
    realtimeUpdates = true,
    pollingInterval = 30000 // 30 seconds default polling interval
  } = options
  
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const subscriptionRef = useRef(null)
  const pollingIntervalRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 0) => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use the optimized function to fetch notifications
      const { data, error: fetchError } = await supabase
        .rpc('get_filtered_notifications', {
          user_id_param: user.id,
          notification_type: null,
          page_size: limit,
          page_number: page,
          include_read: true
        })
      
      if (fetchError) throw fetchError
      
      // Map sender_profile to sender for compatibility
      const notificationsWithSender = (data || []).map(n => ({
        ...n,
        sender: typeof n.sender_profile === 'object' ? n.sender_profile : JSON.parse(n.sender_profile || '{}'),
      }))
      
      // Update notifications
      if (page === 0) {
        setNotifications(notificationsWithSender)
      } else {
        setNotifications(prev => [...prev, ...notificationsWithSender])
      }
      
      // Check if there are more notifications
      setHasMore((data || []).length === limit)
      
      // Get unread count
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      
      if (!countError) {
        setUnreadCount(count || 0)
      }
      
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user, limit])
  
  // Load more notifications
  const loadMore = debounce(() => {
    if (loading || !hasMore) return
    
    const nextPage = Math.ceil(notifications.length / limit)
    fetchNotifications(nextPage)
  }, 300) // Debounce loadMore to prevent multiple rapid calls
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        )
      )
      
      // Update unread count
      const notif = notifications.find(n => n.id === notificationId)
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', user.id)
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error marking notification as read:', err)
      // Revert optimistic update on error
      fetchNotifications(0)
    }
  }, [user, notifications, fetchNotifications])
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
      
      // Update in database using RPC function
      const { error } = await supabase
        .rpc('mark_all_notifications_read', { user_id: user.id })
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      // Revert optimistic update on error
      fetchNotifications(0)
    }
  }, [user, fetchNotifications])
  
  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user) return
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      )
      
      // Update unread count if needed
      const notif = notifications.find(n => n.id === notificationId)
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      // Delete from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', user.id)
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error deleting notification:', err)
      // Revert optimistic update on error
      fetchNotifications(0)
    }
  }, [user, notifications, fetchNotifications])
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user || !realtimeUpdates) return

    // Set up polling as an alternative to real-time for non-critical updates
    if (pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        // Only refetch if we're not already loading and the user is active
        if (!loading && document.visibilityState === 'visible') {
          fetchNotifications(0);
        }
      }, pollingInterval);
    }
    
    // Only subscribe to unread count changes, not full notifications
    if (realtimeUpdates) {
      const channel = supabase
        .channel(`user-notifications-count-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          // Just update the unread count, don't fetch the full notification
          setUnreadCount(prev => prev + 1)
          playNotificationSound()
        })
        .subscribe()
      
      subscriptionRef.current = channel
    }
    
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [user, realtimeUpdates, pollingInterval, loading])
  
  // Initial fetch
  useEffect(() => {
    if (user && fetchOnMount) {
      fetchNotifications(0)
    }
  }, [user, fetchOnMount, fetchNotifications])
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play().catch(err => {
        // Ignore autoplay errors - common in browsers
        console.log('Notification sound autoplay prevented:', err)
      })
    } catch (err) {
      console.log('Could not play notification sound:', err)
    }
  }
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: () => fetchNotifications(0)
  }
}

export default useNotifications