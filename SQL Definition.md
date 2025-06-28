Supabase SQL Definition:

<!-- categories SQL -->
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  icon text not null default '📁'::text,
  slug text not null,
  is_active boolean null default true,
  sort_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_name_key unique (name),
  constraint categories_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_categories_active on public.categories using btree (is_active, sort_order) TABLESPACE pg_default;

create index IF not exists idx_categories_slug on public.categories using btree (slug) TABLESPACE pg_default;


<!-- conversation_participants SQL -->
create table public.conversation_participants (
  conversation_id uuid not null,
  user_id uuid not null,
  joined_at timestamp with time zone null default now(),
  last_read_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint conversation_participants_pkey primary key (conversation_id, user_id),
  constraint conversation_participants_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint conversation_participants_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_conversation_participants_user_id on public.conversation_participants using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_conversation_participants_conversation_id on public.conversation_participants using btree (conversation_id) TABLESPACE pg_default;


<!-- conversations SQL -->
create table public.conversations (
  id uuid not null default gen_random_uuid (),
  type text not null default 'direct'::text,
  name text null,
  avatar_url text null,
  created_by uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete CASCADE,
  constraint conversations_type_check check (
    (type = any (array['direct'::text, 'group'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_conversations_created_by on public.conversations using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_conversations_updated_at on public.conversations using btree (updated_at desc) TABLESPACE pg_default;

create trigger trigger_update_conversations_updated_at BEFORE
update on conversations for EACH row
execute FUNCTION update_updated_at_column ();


<!-- creator_verifications SQL -->
create table public.creator_verifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  status text null default 'pending'::text,
  full_name text null,
  email text null,
  phone_number text null,
  country text null,
  city text null,
  age_verified boolean null default false,
  age_verification_date timestamp with time zone null,
  profile_completed boolean null default false,
  profile_completion_date timestamp with time zone null,
  payment_setup_completed boolean null default false,
  payment_setup_date timestamp with time zone null,
  submitted_at timestamp with time zone null,
  approved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint creator_verifications_pkey primary key (id),
  constraint creator_verifications_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint creator_verifications_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


<!--  followers SQL -->
create table public.followers (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint followers_pkey primary key (follower_id, following_id),
  constraint followers_follower_id_fkey foreign KEY (follower_id) references profiles (id) on delete CASCADE,
  constraint followers_following_id_fkey foreign KEY (following_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_followers_follower_id on public.followers using btree (follower_id) TABLESPACE pg_default;

create index IF not exists idx_followers_following_id on public.followers using btree (following_id) TABLESPACE pg_default;

create index IF not exists idx_followers_created_at on public.followers using btree (created_at) TABLESPACE pg_default;


<!--  hashtags SQL -->
create table public.hashtags (
  id uuid not null default gen_random_uuid (),
  tag text not null,
  usage_count integer null default 0,
  trending_score numeric null default 0,
  last_used_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint hashtags_pkey primary key (id),
  constraint hashtags_tag_key unique (tag)
) TABLESPACE pg_default;

create index IF not exists idx_hashtags_trending on public.hashtags using btree (trending_score desc, usage_count desc) TABLESPACE pg_default;

create index IF not exists idx_hashtags_tag on public.hashtags using btree (tag) TABLESPACE pg_default;


<!--  highlight_stories SQL -->
create table public.highlight_stories (
  highlight_id uuid not null,
  story_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint highlight_stories_pkey primary key (highlight_id, story_id),
  constraint highlight_stories_highlight_id_fkey foreign KEY (highlight_id) references story_highlights (id) on delete CASCADE,
  constraint highlight_stories_story_id_fkey foreign KEY (story_id) references stories (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_highlight_stories_story_id on public.highlight_stories using btree (story_id) TABLESPACE pg_default;


<!--  messages SQL -->
create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  message_type text not null default 'text'::text,
  media_url text null,
  reply_to_id uuid null,
  is_edited boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_reply_to_id_fkey foreign KEY (reply_to_id) references messages (id) on delete set null,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete CASCADE,
  constraint messages_sender_id_profiles_fkey foreign KEY (sender_id) references profiles (id),
  constraint messages_message_type_check check (
    (
      message_type = any (array['text'::text, 'image'::text, 'file'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_messages_conversation_id on public.messages using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_messages_sender_id on public.messages using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_messages_reply_to_id on public.messages using btree (reply_to_id) TABLESPACE pg_default;

create trigger trigger_update_conversation_on_message
after INSERT on messages for EACH row
execute FUNCTION update_conversation_timestamp ();

create trigger trigger_update_messages_updated_at BEFORE
update on messages for EACH row
execute FUNCTION update_updated_at_column ();


<!--  notifications SQL -->
create table public.notifications (
  id uuid not null default gen_random_uuid (),
  recipient_id uuid not null,
  sender_id uuid null,
  type text not null,
  content_id uuid null,
  message text not null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint notifications_pkey primary key (id),
  constraint notifications_recipient_id_fkey foreign KEY (recipient_id) references auth.users (id) on delete CASCADE,
  constraint notifications_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete set null,
  constraint notifications_sender_id_profiles_fkey foreign KEY (sender_id) references profiles (id) on delete set null,
  constraint notifications_type_check check (
    (
      type = any (
        array[
          'like'::text,
          'follow'::text,
          'comment'::text,
          'mention'::text,
          'purchase'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_notifications_recipient_id on public.notifications using btree (recipient_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_notifications_is_read on public.notifications using btree (is_read) TABLESPACE pg_default;

create index IF not exists idx_notifications_type on public.notifications using btree (type) TABLESPACE pg_default;


<!--  payment_methods SQL -->
create table public.payment_methods (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  type text null default 'demo_card'::text,
  card_last_four text null,
  card_brand text null,
  is_default boolean null default false,
  is_demo boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint payment_methods_pkey primary key (id),
  constraint payment_methods_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;


<!-- poll_votes SQL -->
create table public.poll_votes (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  user_id uuid null,
  option_index integer not null,
  created_at timestamp with time zone null default now(),
  constraint poll_votes_pkey primary key (id),
  constraint poll_votes_post_id_user_id_key unique (post_id, user_id),
  constraint poll_votes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint poll_votes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_poll_votes_post_id on public.poll_votes using btree (post_id) TABLESPACE pg_default;


<!-- post_comments SQL -->
create table public.post_comments (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  user_id uuid null,
  content text not null,
  parent_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_parent_id_fkey foreign KEY (parent_id) references post_comments (id) on delete CASCADE,
  constraint post_comments_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_comments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint post_comments_user_id_profiles_fkey foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_post_comments_post_id on public.post_comments using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_post_comments_user_id on public.post_comments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_post_comments_parent_id on public.post_comments using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_post_comments_created_at on public.post_comments using btree (created_at desc) TABLESPACE pg_default;

create trigger trigger_update_comments_updated_at BEFORE
update on post_comments for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_update_post_comment_count
after INSERT
or DELETE on post_comments for EACH row
execute FUNCTION update_post_comment_count ();


<!-- post_likes SQL -->
create table public.post_likes (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint post_likes_pkey primary key (id),
  constraint post_likes_post_id_user_id_key unique (post_id, user_id),
  constraint post_likes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_likes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_likes_post_id on public.post_likes using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_post_likes_user_id on public.post_likes using btree (user_id) TABLESPACE pg_default;

create trigger trigger_update_post_like_count
after INSERT
or DELETE on post_likes for EACH row
execute FUNCTION update_post_like_count ();


<!-- post_saves SQL -->
create table public.post_saves (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint post_saves_pkey primary key (id),
  constraint post_saves_post_id_user_id_key unique (post_id, user_id),
  constraint post_saves_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_saves_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


<!-- post_views SQL -->
create table public.post_views (
  id uuid not null default gen_random_uuid (),
  post_id uuid null,
  user_id uuid null,
  viewed_at timestamp with time zone null default now(),
  constraint post_views_pkey primary key (id),
  constraint post_views_post_id_user_id_key unique (post_id, user_id),
  constraint post_views_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_views_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_views_post_id on public.post_views using btree (post_id) TABLESPACE pg_default;

create trigger trigger_update_post_view_count
after INSERT on post_views for EACH row
execute FUNCTION update_post_view_count ();


<!-- posts SQL -->
create table public.posts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  content text null,
  media_urls text[] null,
  is_premium boolean null default false,
  price numeric(10, 2) null,
  subscriber_discount integer null default 0,
  tags text[] null,
  poll jsonb null default '{}'::jsonb,
  preview_video_url text null,
  scheduled_for timestamp with time zone null,
  status text null default 'published'::text,
  like_count integer null default 0,
  comment_count integer null default 0,
  share_count integer null default 0,
  view_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint posts_user_id_profiles_fkey foreign KEY (user_id) references profiles (id),
  constraint posts_status_check check (
    (
      status = any (
        array[
          'published'::text,
          'scheduled'::text,
          'draft'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_posts_user_id on public.posts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_posts_status on public.posts using btree (status) TABLESPACE pg_default;

create index IF not exists idx_posts_created_at on public.posts using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_posts_scheduled_for on public.posts using btree (scheduled_for) TABLESPACE pg_default;

create index IF not exists idx_posts_tags on public.posts using gin (tags) TABLESPACE pg_default;

create trigger trigger_posts_hashtag_usage
after INSERT
or
update OF tags on posts for EACH row
execute FUNCTION trigger_update_hashtag_usage ();

create trigger trigger_update_posts_updated_at BEFORE
update on posts for EACH row
execute FUNCTION update_updated_at_column ();


<!-- profile_categories SQL -->
create table public.profile_categories (
  profile_id uuid not null,
  category_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint profile_categories_pkey primary key (profile_id, category_id),
  constraint profile_categories_category_id_fkey foreign KEY (category_id) references categories (id) on delete CASCADE,
  constraint profile_categories_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_profile_categories_profile on public.profile_categories using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_profile_categories_category on public.profile_categories using btree (category_id) TABLESPACE pg_default;


<!-- profiles SQL -->
create table public.profiles (
  id uuid not null,
  username text null,
  display_name text null,
  bio text null,
  avatar_url text null,
  user_type text null default 'fan'::text,
  is_verified boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id),
  constraint profiles_user_type_check check (
    (
      user_type = any (array['fan'::text, 'creator'::text])
    )
  )
) TABLESPACE pg_default;


<!-- stories SQL -->
create table public.stories (
  id uuid not null default gen_random_uuid (),
  creator_id uuid null,
  content_type text not null,
  media_url text null,
  media_path text null,
  caption text null,
  text_content text null,
  text_style jsonb null default '{}'::jsonb,
  background_style jsonb null default '{}'::jsonb,
  file_size bigint null,
  file_type text null,
  duration integer null,
  thumbnail_url text null,
  is_active boolean null default true,
  view_count integer null default 0,
  like_count integer null default 0,
  share_count integer null default 0,
  expires_at timestamp with time zone null default (now() + '24:00:00'::interval),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint stories_pkey primary key (id),
  constraint stories_creator_id_fkey foreign KEY (creator_id) references profiles (id) on delete CASCADE,
  constraint stories_content_type_check check (
    (
      content_type = any (array['photo'::text, 'video'::text, 'text'::text])
    )
  )
) TABLESPACE pg_default;


<!-- story_highlights SQL -->
create table public.story_highlights (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  title text not null,
  cover_story_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint story_highlights_pkey primary key (id),
  constraint story_highlights_cover_story_id_fkey foreign KEY (cover_story_id) references stories (id) on delete set null,
  constraint story_highlights_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_story_highlights_user_id on public.story_highlights using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_story_highlights_cover_story on public.story_highlights using btree (cover_story_id) TABLESPACE pg_default;

create trigger trigger_story_highlights_updated_at BEFORE
update on story_highlights for EACH row
execute FUNCTION update_updated_at_column ();


<!-- story_interactions SQL -->
create table public.story_interactions (
  id uuid not null default gen_random_uuid (),
  story_id uuid null,
  user_id uuid null,
  interaction_type text not null,
  reaction_emoji text null,
  created_at timestamp with time zone null default now(),
  constraint story_interactions_pkey primary key (id),
  constraint story_interactions_story_id_user_id_interaction_type_key unique (story_id, user_id, interaction_type),
  constraint story_interactions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint story_interactions_interaction_type_check check (
    (
      interaction_type = any (
        array['like'::text, 'share'::text, 'reaction'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_story_interactions_story_id on public.story_interactions using btree (story_id) TABLESPACE pg_default;

create trigger trigger_update_story_interaction_count
after INSERT
or DELETE on story_interactions for EACH row
execute FUNCTION update_story_interaction_count ();


<!-- story_views SQL -->
create table public.story_views (
  id uuid not null default gen_random_uuid (),
  story_id uuid null,
  viewer_id uuid null,
  viewed_at timestamp with time zone null default now(),
  constraint story_views_pkey primary key (id),
  constraint story_views_story_id_viewer_id_key unique (story_id, viewer_id),
  constraint story_views_viewer_id_fkey foreign KEY (viewer_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_story_views_story_id on public.story_views using btree (story_id) TABLESPACE pg_default;

create index IF not exists idx_story_views_viewer_id on public.story_views using btree (viewer_id) TABLESPACE pg_default;

create trigger trigger_update_story_view_count
after INSERT on story_views for EACH row
execute FUNCTION update_story_view_count ();


<!-- user_presence SQL -->
create table public.user_presence (
  user_id uuid not null,
  status text not null default 'offline'::text,
  last_seen_at timestamp with time zone null default now(),
  typing_in_conversation uuid null,
  updated_at timestamp with time zone null default now(),
  constraint user_presence_pkey primary key (user_id),
  constraint user_presence_typing_in_conversation_fkey foreign KEY (typing_in_conversation) references conversations (id) on delete set null,
  constraint user_presence_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_presence_status_check check (
    (
      status = any (
        array['online'::text, 'away'::text, 'offline'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_presence_status on public.user_presence using btree (status) TABLESPACE pg_default;

create index IF not exists idx_user_presence_typing on public.user_presence using btree (typing_in_conversation) TABLESPACE pg_default;

create trigger trigger_update_user_presence_updated_at BEFORE
update on user_presence for EACH row
execute FUNCTION update_updated_at_column ();
