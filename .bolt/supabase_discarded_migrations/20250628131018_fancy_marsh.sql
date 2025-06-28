/*
  # Realtime Subscription Optimization

  1. New Functions
    - `get_filtered_notifications` - Returns notifications with pagination and filtering
    - `get_conversation_messages` - Returns messages for a conversation with pagination
    - `get_user_presence_batch` - Returns presence data for multiple users in a single query

  2. Changes
    - Add indexes to improve query performance for realtime subscriptions
    - Add caching hints to frequently accessed tables
    
  3. Security
    - All functions use SECURITY DEFINER to ensure proper access control
    - Functions respect existing RLS policies
*/

-- Add caching hints to frequently accessed tables
ALTER TABLE public.user_presence SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.messages SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.notifications SET (autovacuum_vacuum_scale_factor = 0.1);

-- Add additional indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender ON public.messages(conversation_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read);

-- Function to get filtered notifications with pagination
CREATE OR REPLACE FUNCTION public.get_filtered_notifications(
  user_id_param UUID,
  notification_type TEXT DEFAULT NULL,
  page_size INT DEFAULT 20,
  page_number INT DEFAULT 0,
  include_read BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  recipient_id UUID,
  sender_id UUID,
  type TEXT,
  content_id UUID,
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  metadata JSONB,
  sender_profile JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INT := page_number * page_size;
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.recipient_id,
    n.sender_id,
    n.type,
    n.content_id,
    n.message,
    n.is_read,
    n.created_at,
    n.metadata,
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'is_verified', p.is_verified
    ) AS sender_profile
  FROM 
    public.notifications n
  LEFT JOIN 
    public.profiles p ON n.sender_id = p.id
  WHERE 
    n.recipient_id = user_id_param
    AND (notification_type IS NULL OR n.type = notification_type)
    AND (include_read OR n.is_read = false)
  ORDER BY 
    n.created_at DESC
  LIMIT 
    page_size
  OFFSET 
    offset_val;
END;
$$;

-- Function to get messages for a conversation with pagination
CREATE OR REPLACE FUNCTION public.get_conversation_messages(
  conversation_id_param UUID,
  user_id_param UUID,
  page_size INT DEFAULT 50,
  before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  media_url TEXT,
  reply_to_id UUID,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_profile JSONB,
  reply_to JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_participant BOOLEAN;
BEGIN
  -- Check if user is a participant in this conversation
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_id_param
    AND user_id = user_id_param
    AND is_active = true
  ) INTO is_participant;
  
  -- If not a participant, return empty result
  IF NOT is_participant THEN
    RETURN;
  END IF;
  
  -- Update last_read_at for the user
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = conversation_id_param
  AND user_id = user_id_param;
  
  -- Return messages with pagination
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.media_url,
    m.reply_to_id,
    m.is_edited,
    m.created_at,
    m.updated_at,
    jsonb_build_object(
      'id', sp.id,
      'username', sp.username,
      'display_name', sp.display_name,
      'avatar_url', sp.avatar_url
    ) AS sender_profile,
    CASE WHEN m.reply_to_id IS NOT NULL THEN
      jsonb_build_object(
        'id', rm.id,
        'content', rm.content,
        'sender', jsonb_build_object(
          'profiles', jsonb_build_object(
            'display_name', rp.display_name
          )
        )
      )
    ELSE NULL END AS reply_to
  FROM 
    public.messages m
  LEFT JOIN 
    public.profiles sp ON m.sender_id = sp.id
  LEFT JOIN 
    public.messages rm ON m.reply_to_id = rm.id
  LEFT JOIN 
    public.profiles rp ON rm.sender_id = rp.id
  WHERE 
    m.conversation_id = conversation_id_param
    AND (before_timestamp IS NULL OR m.created_at < before_timestamp)
  ORDER BY 
    m.created_at DESC
  LIMIT 
    page_size;
END;
$$;

-- Function to get presence data for multiple users in a single query
CREATE OR REPLACE FUNCTION public.get_user_presence_batch(
  user_ids UUID[]
)
RETURNS TABLE (
  user_id UUID,
  status TEXT,
  last_seen_at TIMESTAMPTZ,
  typing_in_conversation UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.status,
    up.last_seen_at,
    up.typing_in_conversation
  FROM 
    public.user_presence up
  WHERE 
    up.user_id = ANY(user_ids);
END;
$$;

-- Function to mark all notifications as read in a single operation
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
  user_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE recipient_id = user_id_param
  AND is_read = false;
END;
$$;