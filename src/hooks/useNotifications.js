import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useNotifications = (options = {}) => {
  const { 
    limit = 20, 
    fetchOnMount = true,
    realtimeUpdates = true
  } = options
  
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const subscriptionRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 0) => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch notifications with sender profile using subquery
      const { data, error: fetchError } = await supabase
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
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)
      
      if (fetchError) throw fetchError
      
      // Map sender_profile to sender for compatibility
      const notificationsWithSender = (data || []).map(n => ({
        ...n,
        sender: n.sender_profile,
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
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    
    const nextPage = Math.ceil(notifications.length / limit)
    fetchNotifications(nextPage)
  }, [loading, hasMore, notifications.length, limit, fetchNotifications])
  
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
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, async (payload) => {
        console.log('New notification received:', payload)
        
        // Fetch the complete notification with sender profile
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
          .eq('id', payload.new.id)
          .single()
        
        if (!error && data) {
          // Add to notifications list
          setNotifications(prev => [{ ...data, sender: data.sender_profile }, ...prev])
          
          // Update unread count
          if (!data.is_read) {
            setUnreadCount(prev => prev + 1)
          }
          
          // Play notification sound
          playNotificationSound()
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('Notification updated:', payload)
        
        // Update notification in list
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === payload.new.id 
              ? { ...notif, ...payload.new } 
              : notif
          )
        )
        
        // Update unread count if read status changed
        if (payload.old.is_read !== payload.new.is_read) {
          setUnreadCount(prev => 
            payload.new.is_read 
              ? Math.max(0, prev - 1) 
              : prev + 1
          )
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('Notification deleted:', payload)
        
        // Remove from notifications list
        setNotifications(prev => 
          prev.filter(notif => notif.id !== payload.old.id)
        )
        
        // Update unread count if needed
        if (!payload.old.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe()
    
    subscriptionRef.current = channel
    
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [user, realtimeUpdates])
  
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