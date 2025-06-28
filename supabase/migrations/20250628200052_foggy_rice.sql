/*
  # Fix Conversation Participants Relationship

  1. Changes
    - Add proper relationship between conversation_participants and profiles
    - Fix the query that was causing the 400 error

  2. Security
    - Maintain proper access controls for messaging tables
*/

-- Create a view to simplify the relationship between conversation_participants and profiles
CREATE OR REPLACE VIEW conversation_participant_profiles AS
SELECT
  cp.conversation_id,
  cp.user_id,
  cp.joined_at,
  cp.last_read_at,
  cp.is_active,
  p.username,
  p.display_name,
  p.avatar_url,
  p.is_verified,
  p.user_type
FROM
  conversation_participants cp
JOIN
  profiles p ON cp.user_id = p.id;

-- Update the RLS policy to use the view
CREATE POLICY "Users can read participant profiles" 
ON conversation_participant_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  conversation_id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid() AND is_active = true
  )
);