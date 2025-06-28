/*
  # Add foreign key relationship between conversation_participants and profiles

  1. New Foreign Key Constraint
    - Add `conversation_participants_user_id_profiles_fkey` to link `user_id` in `conversation_participants` to `id` in `profiles`
  
  2. Purpose
    - Enables Supabase to correctly infer the relationship for fetching profile data
    - Fixes PGRST200 error when querying conversation participants with profile information
*/

-- Add foreign key constraint linking conversation_participants.user_id to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversation_participants_user_id_profiles_fkey'
    AND table_name = 'conversation_participants'
  ) THEN
    ALTER TABLE conversation_participants 
    ADD CONSTRAINT conversation_participants_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;