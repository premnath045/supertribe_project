import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Debounce function to limit frequency of function calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const usePollVotes = (postId) => {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState(null)
  const [voteCount, setVoteCount] = useState({})
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const subscriptionRef = useRef(null)

  // Fetch votes for the poll
  const fetchVotes = useCallback(async () => {
    if (!postId) return

    try {
      setLoading(true)
      setError(null)

      // Get all votes for this poll
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('option_index')
        .eq('post_id', postId)

      if (votesError) throw votesError

      // Count votes by option
      const counts = {}
      votes.forEach(vote => {
        const { option_index } = vote
        counts[option_index] = (counts[option_index] || 0) + 1
      })

      setVoteCount(counts)
      setTotalVotes(votes.length)

      // Check if user has voted
      if (user) {
        const { data: userVoteData, error: userVoteError } = await supabase
          .from('poll_votes')
          .select('option_index')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single()

        if (!userVoteError && userVoteData) {
          setUserVote(userVoteData.option_index)
        }
      }
    } catch (err) {
      console.error('Error fetching poll votes:', err)
      setError('Failed to load poll votes')
    } finally {
      setLoading(false)
    }
  }, [postId, user])

  // Submit a vote
  const submitVote = useCallback(async (optionIndex) => {
    if (!user || !postId) return

    try {
      setSubmitting(true)
      setError(null)

      // Check if user already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('poll_votes')
        .select('id, option_index')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      // Optimistic UI update
      const newVoteCounts = { ...voteCount }
      
      // If user already voted, remove their previous vote
      if (existingVote) {
        const prevIndex = existingVote.option_index
        newVoteCounts[prevIndex] = Math.max(0, (newVoteCounts[prevIndex] || 1) - 1)
      }

      // Add new vote
      newVoteCounts[optionIndex] = (newVoteCounts[optionIndex] || 0) + 1
      
      // Update state
      setVoteCount(newVoteCounts)
      setUserVote(optionIndex)
      setTotalVotes(prev => existingVote ? prev : prev + 1)

      // Insert or update vote in database
      const { error } = await supabase
        .from('poll_votes')
        .upsert({
          post_id: postId,
          user_id: user.id,
          option_index: optionIndex,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return true
    } catch (err) {
      console.error('Error submitting vote:', err)
      setError('Failed to submit vote')
      
      // Revert optimistic update
      fetchVotes()
      return false
    } finally {
      setSubmitting(false)
    }
  }, [postId, user, voteCount, fetchVotes])

  // Calculate percentages
  const getPercentages = useCallback(() => {
    if (totalVotes === 0) return {}
    
    const percentages = {}
    Object.entries(voteCount).forEach(([optionIndex, count]) => {
      percentages[optionIndex] = Math.round((count / totalVotes) * 100)
    })
    
    return percentages
  }, [voteCount, totalVotes])

  // Set up initial data fetch
  useEffect(() => {
    if (postId) {
      fetchVotes()
    }
  }, [postId, fetchVotes])

  useEffect(() => {    
    // Set up polling instead of real-time subscription
    const pollingInterval = setInterval(() => {
      // Only poll if the document is visible
      if (document.visibilityState === 'visible') {
        fetchVotes();
      }
    }, 10000); // Poll every 10 seconds
    
    // For user's own votes, we still want real-time updates
    if (user) {
      const channel = supabase
        .channel(`my-poll-votes-${postId}-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'poll_votes',
            filter: `post_id=eq.${postId} AND user_id=eq.${user.id}`
          }, () => {
            fetchVotes()
          }
        )
        .subscribe()
        
      subscriptionRef.current = channel;
    }
    
    return () => {
      clearInterval(pollingInterval);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    }
  }, [postId, fetchVotes, user])

  return {
    userVote,
    voteCount,
    totalVotes,
    percentages: getPercentages(),
    loading,
    submitting,
    error,
    submitVote: debounce(submitVote, 300), // Debounce vote submission
    refetch: fetchVotes
  }
}

export default usePollVotes