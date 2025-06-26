/*
  # Story Highlights

  1. New Tables
    - `story_highlights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text, title of the highlight)
      - `cover_story_id` (uuid, references stories.id)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
    - `highlight_stories`
      - `highlight_id` (uuid, references story_highlights.id)
      - `story_id` (uuid, references stories.id)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own highlights
*/

-- Create story highlights table
CREATE TABLE IF NOT EXISTS story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_story_id uuid REFERENCES stories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create highlight stories table (join table)
CREATE TABLE IF NOT EXISTS highlight_stories (
  highlight_id uuid REFERENCES story_highlights(id) ON DELETE CASCADE,
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (highlight_id, story_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_highlights_user_id ON story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_cover_story ON story_highlights(cover_story_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_story_id ON highlight_stories(story_id);

-- Enable RLS
ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- Create policies for story_highlights
CREATE POLICY "Users can manage their own highlights"
ON story_highlights
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read user highlights"
ON story_highlights
FOR SELECT
TO public
USING (TRUE);

-- Create policies for highlight_stories
CREATE POLICY "Users can manage stories in their highlights"
ON highlight_stories
FOR ALL
TO authenticated
USING (
  highlight_id IN (
    SELECT id FROM story_highlights WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  highlight_id IN (
    SELECT id FROM story_highlights WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read highlight stories"
ON highlight_stories
FOR SELECT
TO public
USING (TRUE);

-- Update trigger to update updated_at
CREATE TRIGGER trigger_story_highlights_updated_at
BEFORE UPDATE ON story_highlights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();