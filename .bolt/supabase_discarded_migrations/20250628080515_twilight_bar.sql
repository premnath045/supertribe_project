/*
# Add poll votes table

1. New Tables
  - `poll_votes`
    - `id` (uuid, primary key)
    - `post_id` (uuid, foreign key to posts)
    - `user_id` (uuid, foreign key to auth.users)
    - `option_index` (integer, not null)
    - `created_at` (timestamp with time zone)

2. Security
  - Enable RLS on `poll_votes` table
  - Add policies for authenticated users to vote, change their vote, and view votes

3. Constraints
  - Unique constraint on post_id and user_id to prevent multiple votes
  - Index on post_id for faster lookups
*/

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint to prevent multiple votes from the same user
ALTER TABLE poll_votes ADD CONSTRAINT poll_votes_post_id_user_id_key UNIQUE (post_id, user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_poll_votes_post_id ON poll_votes(post_id);

-- Enable Row Level Security
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can vote" 
  ON poll_votes
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" 
  ON poll_votes
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view poll votes" 
  ON poll_votes
  FOR SELECT
  TO public
  USING (true);