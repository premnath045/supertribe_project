/*
  # Create Notifications System
  
  1. New Tables
    - `notifications` - Stores user notifications
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, references users)
      - `sender_id` (uuid, references users)
      - `type` (text, enum: 'like', 'follow', 'comment', 'mention', 'purchase')
      - `content_id` (uuid, reference to related content)
      - `message` (text, notification text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
      - `metadata` (jsonb, additional context)
  
  2. Security
    - Enable RLS on `notifications` table
    - Add policies for authenticated users to manage their notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('like', 'follow', 'comment', 'mention', 'purchase')),
  content_id uuid,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" 
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create trigger functions for automatic notifications

-- Function to create notification when someone likes a post
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    content_id,
    message,
    metadata
  )
  VALUES (
    (SELECT user_id FROM posts WHERE id = NEW.post_id),
    NEW.user_id,
    'like',
    NEW.post_id,
    'liked your post',
    jsonb_build_object(
      'post_id', NEW.post_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when someone follows a user
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user follows themselves (shouldn't happen, but just in case)
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    content_id,
    message,
    metadata
  )
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NULL,
    'started following you',
    '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when someone comments on a post
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user comments on their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    content_id,
    message,
    metadata
  )
  VALUES (
    (SELECT user_id FROM posts WHERE id = NEW.post_id),
    NEW.user_id,
    'comment',
    NEW.post_id,
    'commented on your post',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'comment_text', substring(NEW.content, 1, 100)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when someone mentions a user in a comment
CREATE OR REPLACE FUNCTION create_mention_notification()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_username text;
  mentioned_user_id uuid;
  mention_pattern text := '@([a-zA-Z0-9_]+)';
  mention_match text;
BEGIN
  -- Extract mentions from comment content
  FOR mention_match IN
    SELECT (regexp_matches(NEW.content, mention_pattern, 'g'))[1]
  LOOP
    mentioned_username := mention_match;
    
    -- Find the user ID for this username
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE username = mentioned_username;
    
    -- If user exists and is not the comment author, create notification
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        content_id,
        message,
        metadata
      )
      VALUES (
        mentioned_user_id,
        NEW.user_id,
        'mention',
        NEW.post_id,
        'mentioned you in a comment',
        jsonb_build_object(
          'post_id', NEW.post_id,
          'comment_id', NEW.id,
          'comment_text', substring(NEW.content, 1, 100)
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER create_like_notification_trigger
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER create_follow_notification_trigger
AFTER INSERT ON followers
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

CREATE TRIGGER create_comment_notification_trigger
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

CREATE TRIGGER create_mention_notification_trigger
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION create_mention_notification();

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE recipient_id = user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql;