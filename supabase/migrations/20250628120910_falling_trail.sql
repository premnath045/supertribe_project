/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, foreign key to profiles)
      - `sender_id` (uuid, foreign key to profiles, nullable)
      - `type` (text, notification type)
      - `message` (text, notification message)
      - `metadata` (jsonb, additional data)
      - `is_read` (boolean, read status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to read their own notifications
    - Add policies for authenticated users to create notifications

  3. Functions
    - Add RPC function to mark all notifications as read for a user

  4. Indexes
    - Add indexes for efficient querying by recipient, sender, read status, and creation time
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  sender_id uuid NULL,
  type text NOT NULL,
  message text NULL,
  metadata jsonb NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY['like'::text, 'follow'::text, 'comment'::text, 'purchase'::text, 'mention'::text, 'message'::text, 'story_view'::text, 'story_like'::text])
  )
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications USING btree (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications USING btree (type);

-- RLS Policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RPC function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE recipient_id = user_id AND is_read = false;
END;
$$;