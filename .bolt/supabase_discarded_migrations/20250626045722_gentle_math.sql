/*
  # Create Followers System

  1. New Tables
    - `followers`
      - `follower_id` (uuid, references users)
      - `following_id` (uuid, references users) 
      - `created_at` (timestamp)
      - Primary key is a combination of follower_id and following_id
  
  2. Security
    - Enable RLS on `followers` table
    - Add policies for authenticated users to manage their own follows
    - Add policy for public to read follows
    
  3. Functions
    - Create helper functions for getting follower/following counts
    - Create functions for follow status checking
*/

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at);

-- Enable row level security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Create policies for the followers table
-- Anyone can read followers data
CREATE POLICY "Anyone can read followers"
  ON public.followers
  FOR SELECT
  TO public
  USING (true);

-- Users can follow others (insert)
CREATE POLICY "Users can follow others"
  ON public.followers
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can unfollow others (delete)
CREATE POLICY "Users can unfollow others"
  ON public.followers
  FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Create a function to get follower count
CREATE OR REPLACE FUNCTION public.get_follower_count(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.followers
  WHERE following_id = profile_id;
  
  RETURN count;
END;
$$;

-- Create a function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.followers
  WHERE follower_id = profile_id;
  
  RETURN count;
END;
$$;

-- Create a function to check if one user follows another
CREATE OR REPLACE FUNCTION public.check_if_follows(follower uuid, following uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  does_follow boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.followers
    WHERE follower_id = follower
    AND following_id = following
  ) INTO does_follow;
  
  RETURN does_follow;
END;
$$;

-- Create a function to get all followers for a user
CREATE OR REPLACE FUNCTION public.get_followers(profile_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT follower_id
  FROM public.followers
  WHERE following_id = profile_id;
END;
$$;

-- Create a function to get all users a user is following
CREATE OR REPLACE FUNCTION public.get_following(profile_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT following_id
  FROM public.followers
  WHERE follower_id = profile_id;
END;
$$;