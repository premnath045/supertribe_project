import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import NotificationSound from '../Notifications/NotificationSound'

// Debounce function to limit frequency of function calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const pollingIntervalRef = useRef(null)
  
  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    
    // Throttle fetches to no more than once every 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000) {
      return;
    }
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      
      if (!error) {
        setUnreadCount(count || 0)
        setLastFetchTime(now)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }
  
  // Mark all notifications as read
  const markAllAsRead = debounce(async () => {
    if (!user) return
    
    try {
      // Optimistic update
      setUnreadCount(0)
      setHasNewNotification(false)
      
      // Update in database using RPC function
      const { error } = await supabase.rpc(
        'mark_all_notifications_read', 
        { user_id_param: user.id }
      )
      
      if (error) throw error
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      // Revert optimistic update on error
      fetchUnreadCount()
    }
  }, 500) // Debounce to prevent multiple rapid calls
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user) return
    
    // Initial fetch of unread count
    fetchUnreadCount()
    
    // Set up polling for unread count instead of real-time subscription
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if the document is visible
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 60000); // Poll every minute
    
    // Minimal subscription for new notifications only
    const channel = supabase
      .channel(`user-new-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        // Just update the unread count and notification state
        setUnreadCount(prev => prev + 1);
        setHasNewNotification(true);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
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
    refreshNotifications: debounce(fetchUnreadCount, 1000) // Debounce refresh
  }
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationSound play={hasNewNotification} />
    </NotificationContext.Provider>
  )
}

export default NotificationProvider