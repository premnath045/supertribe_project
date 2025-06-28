import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadMessageImage } from '../lib/messageUtils'

export const useMessages = (conversationId) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [imageUpload, setImageUpload] = useState({
    loading: false,
    error: null,
    preview: null
  })
  const subscriptionRef = useRef(null)

  // Fetch messages for the conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('messages')
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
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const transformedMessages = (data || []).map(message => ({
        ...message,
        senderName: message.profiles?.display_name || 'Unknown User',
        senderAvatar: message.profiles?.avatar_url ||
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50'
      }))

      setMessages(transformedMessages)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, user])

  // Send a new message
  const sendMessage = useCallback(async (content, messageType = 'text', mediaUrl = null, replyToId = null) => {
    if (!user || !conversationId || !content.trim()) return

    setSending(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
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

      // Transform the message
      const transformedMessage = {
        ...data,
        senderName: data.profiles?.display_name || 'Unknown User',
        senderAvatar: data.profiles?.avatar_url ||
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50'
      }

      // Optimistically add message to local state
      setMessages(prev => [...prev, transformedMessage])

      return transformedMessage
    } catch (err) {
      console.error('Error sending message:', err)
      setSending(false)
      throw err
    }
  }, [user, conversationId])

  // Upload and send image message
  const sendImageMessage = useCallback(async (file, caption = '') => {
    if (!user || !conversationId || !file) return
    
    setImageUpload(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Upload image to storage
      const uploadResult = await uploadMessageImage(file, user.id)
      
      // Send message with image
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: caption || 'Image',
          message_type: 'image',
          media_url: uploadResult.url
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
      
      // Transform the message
      const transformedMessage = {
        ...data,
        senderName: data.profiles?.display_name || 'Unknown User',
        senderAvatar: data.profiles?.avatar_url ||
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50'
      }
      
      // Optimistically add message to local state
      setMessages(prev => [...prev, transformedMessage])
      
      // Clear image upload state
      setImageUpload({ loading: false, error: null, preview: null })
      
      return transformedMessage
    } catch (err) {
      console.error('Error sending image message:', err)
      setImageUpload(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to upload image' 
      }))
      throw err
    } finally {
      setSending(false)
    }
  }, [user, conversationId])

  // Edit a message
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!user || !newContent.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id)

      if (error) throw error

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent.trim(), is_edited: true }
          : msg
      ))
    } catch (err) {
      console.error('Error editing message:', err)
      setError('Failed to edit message')
      throw err
    }
  }, [user])

  // Delete a message
  const deleteMessage = useCallback(async (message) => {
    if (!user) return
    
    if (message.sender_id !== user.id) {
      throw new Error('You can only delete your own messages')
    }

    try {
      // If message has an image, delete it from storage
      if (message.message_type === 'image' && message.media_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(message.media_url)
          const pathSegments = url.pathname.split('/')
          const bucketName = pathSegments[1]
          const filePath = pathSegments.slice(2).join('/')
          
          // Delete the file from storage
          await supabase.storage
            .from(bucketName)
            .remove([filePath])
        } catch (storageError) {
          console.warn('Failed to delete image from storage:', storageError)
          // Continue with message deletion even if storage cleanup fails
        }
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id)
        .eq('sender_id', user.id)

      if (error) throw error

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== message.id))
    } catch (err) {
      console.error('Error deleting message:', err)
      throw err
    }
  }, [user])

  // Set image preview
  const setImagePreview = (file) => {
    if (file) {
      const preview = URL.createObjectURL(file)
      setImageUpload(prev => ({ ...prev, preview }))
    } else {
      // Clear any existing preview
      if (imageUpload.preview) {
        URL.revokeObjectURL(imageUpload.preview)
      }
      setImageUpload({ loading: false, error: null, preview: null })
    }
  }

  // Clear image preview
  const clearImagePreview = () => {
    if (imageUpload.preview) {
      URL.revokeObjectURL(imageUpload.preview)
    }
    setImageUpload({ loading: false, error: null, preview: null })
  }

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user || !conversationId) return

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [user, conversationId])

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return

    fetchMessages()

    // Subscribe to new messages in this conversation
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message received:', payload)
          
          // Fetch the complete message with relations
          const { data, error } = await supabase
            .from('messages')
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
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            const transformedMessage = {
              ...data,
              senderName: data.profiles?.display_name || 'Unknown User',
              senderAvatar: data.profiles?.avatar_url ||
                'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50'
            }

            setMessages(prev => {
              // Check if message already exists (avoid duplicates from optimistic updates)
              const exists = prev.some(msg => msg.id === data.id)
              if (exists) return prev
              
              return [...prev, transformedMessage]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Message updated:', payload)
          
          // Fetch the updated message with relations
          const { data, error } = await supabase
            .from('messages')
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
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            const transformedMessage = {
              ...data,
              senderName: data.profiles?.display_name || 'Unknown User',
              senderAvatar: data.profiles?.avatar_url ||
                'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50'
            }

            setMessages(prev => 
              prev.map(msg => msg.id === data.id ? transformedMessage : msg)
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message deleted:', payload)
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [conversationId, fetchMessages])

  return {
    messages,
    loading,
    error,
    sending,
    imageUpload,
    sendMessage,
    sendImageMessage,
    editMessage,
    deleteMessage,
    setImagePreview,
    clearImagePreview,
    markAsRead,
    refetch: fetchMessages
  }
}