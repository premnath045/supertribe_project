import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import NotificationSound from '../Notifications/NotificationSound'

// Create context
const NotificationContext = createContext({
  unreadCount: 0,
  hasNewNotification: false,
  markAllAsRead: () => {},
  refreshNotifications: () => {}
})

// Hook to use notification context
export const useNotificationContext = () => useContext(NotificationContext)

function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  
  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      
      if (!error) {
        setUnreadCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return
    
    try {
      // Optimistic update
      setUnreadCount(0)
      setHasNewNotification(false)
      
      // Update in database using RPC function
      const { error } = await supabase
        .rpc('mark_all_notifications_read', { user_id: user.id })
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      // Revert optimistic update on error
      fetchUnreadCount()
    }
  }
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user) return
    
    // Initial fetch
    fetchUnreadCount()
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`user-notifications-count-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount()
        setHasNewNotification(true)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        // If read status changed, update count
        if (payload.old.is_read !== payload.new.is_read) {
          fetchUnreadCount()
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
  
  // Reset new notification flag when count changes
  useEffect(() => {
    if (unreadCount === 0) {
      setHasNewNotification(false)
    }
  }, [unreadCount])
  
  // Context value
  const value = {
    unreadCount,
    hasNewNotification,
    markAllAsRead,
    refreshNotifications: fetchUnreadCount
  }
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationSound play={hasNewNotification} />
    </NotificationContext.Provider>
  )
}

export default NotificationProvider