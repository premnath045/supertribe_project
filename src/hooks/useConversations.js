import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useConversations = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const subscriptionRef = useRef(null)

  // Fetch conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

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
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('conversations(updated_at)', { ascending: false })

      if (error) throw error

      // Fetch additional data for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (item) => {
          // Make sure conversations property exists
          if (!item.conversations) {
            console.error('Conversation data missing:', item);
            return null;
          }
          
          const conversation = item.conversations;
          
          // Get other participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles!inner (
                username,
                display_name,
                avatar_url,
                is_verified,
                user_type
              )
            `)
            .eq('conversation_id', conversation.id)
            .eq('is_active', true)
            .neq('user_id', user.id)

          // Get the last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              message_type,
              sender_id,
              created_at,
              sender:sender_id (
                profiles (display_name)
              )
            `)
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { data: unreadData } = await supabase
            .rpc('get_unread_count', {
              user_id_param: user.id,
              conversation_id_param: conversation.id
            })

          // For direct conversations, use the other participant's info
          let displayName = conversation.name
          let avatarUrl = conversation.avatar_url
          
          if (conversation.type === 'direct' && participants && participants.length > 0) {
            const otherParticipant = participants[0]
            displayName = otherParticipant.profiles?.display_name || 
                         otherParticipant.profiles?.username || 
                         'Unknown User'
            avatarUrl = otherParticipant.profiles?.avatar_url
          }

          return {
            id: conversation.id,
            type: conversation.type,
            name: displayName,
            avatar_url: avatarUrl,
            participants: participants || [],
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              messageType: lastMessage.message_type,
              senderId: lastMessage.sender_id,
              senderName: lastMessage.sender?.profiles?.display_name || 'Unknown',
              createdAt: new Date(lastMessage.created_at),
              isFromCurrentUser: lastMessage.sender_id === user.id
            } : null,
            unreadCount: unreadData || 0,
            lastReadAt: item.last_read_at ? new Date(item.last_read_at) : null,
            updatedAt: new Date(conversation.updated_at)
          }
        })
      )

      // Sort by updated_at descending
      const validConversations = conversationsWithDetails.filter(Boolean);
      validConversations.sort((a, b) => b.updatedAt - a.updatedAt)

      setConversations(validConversations)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create or get direct conversation with another user
  const getOrCreateDirectConversation = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return null

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_direct_conversation', {
          user1_id: user.id,
          user2_id: otherUserId
        })

      if (error) throw error

      // Refresh conversations list
      await fetchConversations()

      return data
    } catch (err) {
      console.error('Error creating/getting conversation:', err)
      setError('Failed to create conversation')
      return null
    }
  }, [user, fetchConversations])

  // Create a group conversation
  const createGroupConversation = useCallback(async (name, participantIds, avatarUrl = null) => {
    if (!user || !name || !participantIds.length) return null

    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name,
          avatar_url: avatarUrl,
          created_by: user.id
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants (including the creator)
      const participants = [user.id, ...participantIds]
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          participants.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId
          }))
        )

      if (participantsError) throw participantsError

      // Refresh conversations list
      await fetchConversations()

      return conversation.id
    } catch (err) {
      console.error('Error creating group conversation:', err)
      setError('Failed to create group conversation')
      return null
    }
  }, [user, fetchConversations])

  // Leave a conversation
  const leaveConversation = useCallback(async (conversationId) => {
    if (!user) return

    try {
      await supabase
        .from('conversation_participants')
        .update({ is_active: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    } catch (err) {
      console.error('Error leaving conversation:', err)
      setError('Failed to leave conversation')
    }
  }, [user])

  // Set up real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return

    fetchConversations()

    // Subscribe to conversation changes
    const subscription = supabase
      .channel(`conversations:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=in.(${
            supabase.from('conversation_participants')
              .select('conversation_id')
              .eq('user_id', user.id)
              .eq('is_active', true)
          })`
        },
        () => {
          // Refresh conversations on any change
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${
            supabase.from('conversation_participants')
              .select('conversation_id')
              .eq('user_id', user.id)
              .eq('is_active', true)
          })`
        },
        () => {
          // Refresh conversations when new messages arrive
          fetchConversations()
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [user, fetchConversations])

  return {
    conversations,
    loading,
    error,
    getOrCreateDirectConversation,
    createGroupConversation,
    leaveConversation,
    refetch: fetchConversations
  }
}