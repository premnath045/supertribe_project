import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import StoriesCarousel from '../components/Stories/StoriesCarousel'
import PostFeed from '../components/Feed/PostFeed'
import { supabase } from '../lib/supabase'

function HomePage() {
  const { openStoryViewer, openPostDetail, openShareSheet, openStoryCreation } = useOutletContext()
  const { isCreator, user } = useAuth()

  // Set up real-time subscription for poll votes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('poll-votes-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_votes'
      }, (payload) => {
        console.log('Poll vote change detected:', payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Stories Section */}
      <div className="bg-white border-b border-gray-200">
        <StoriesCarousel 
          onStoryClick={openStoryViewer}
          onCreateStory={isCreator() ? openStoryCreation : undefined}
        />
      </div>

      {/* Posts Feed */}
      <div className="max-w-lg mx-auto">
        <PostFeed 
          // Remove onPostClick to allow PostFeed to use its default navigation behavior
          onShareClick={openShareSheet}
        />
      </div>
    </motion.div>
  )
}

export default HomePage