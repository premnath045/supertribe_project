import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchActiveStories } from '../lib/stories'

// Cache duration in milliseconds (2 minutes)
const CACHE_DURATION = 2 * 60 * 1000;

export const useStories = () => {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [pollingInterval, setPollingInterval] = useState(null)

  const loadStories = async () => {
    // Check if cache is still valid
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION && stories.length > 0) {
      console.log('Using cached stories data');
      return;
    }
    
    try {
      setLoading(true)
      setError(null)
      const data = await fetchActiveStories()
      setStories(data)
      setLastFetchTime(now)
    } catch (err) {
      console.error('Error loading stories:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addNewStory = (newStory) => {
    setStories(prev => [newStory, ...prev])
  }

  const removeStory = (storyId) => {
    setStories(prev => prev.filter(story => story.id !== storyId))
  }

  // Group stories by user for carousel display
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.profiles?.id || story.creator_id
    if (!userId) return acc
    if (!acc[userId]) acc[userId] = []
    acc[userId].push(story)
    return acc
  }, {})

  // For carousel: show only the latest story per user
  const storiesForCarousel = Object.values(groupedStories)
    .map(storyArr => storyArr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0])

  // Helper: get all stories for a user, sorted by created_at
  const getUserStories = (userId) => {
    return (groupedStories[userId] || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  useEffect(() => {
    // Initial load
    loadStories()
    
    // Set up polling instead of real-time subscription
    const interval = setInterval(() => {
      // Only poll if the document is visible
      if (document.visibilityState === 'visible') {
        loadStories();
      }
    }, 60000); // Poll every minute
    
    setPollingInterval(interval);
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [])

  return {
    stories, // all stories (flat)
    storiesForCarousel, // for carousel (one per user)
    loading,
    error,
    loadStories,
    addNewStory,
    removeStory,
    getUserStories
  }
}