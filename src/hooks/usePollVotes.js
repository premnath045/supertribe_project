import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubmitPollVote } from './useTanstackQuery'
import { pollsApi } from '../lib/queryClient'

export const usePollVotes = (postId) => {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState(null)
  const [voteCount, setVoteCount] = useState({})
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Debounce ref for fetch operations
  const debounceTimeoutRef = useRef(null)

  // Use the submit vote mutation
  const submitVoteMutation = useSubmitPollVote(postId, {
    pollsApi,
    onError: (error) => {
      console.error('Error submitting vote:', error)
      setError('Failed to submit vote')
    }
  })

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

      // Submit vote using the mutation
      await submitVoteMutation.mutateAsync({ 
        userId: user.id, 
        optionIndex 
      })

      return true
    } catch (err) {
      console.error('Error submitting vote:', err)
      setError('Failed to submit vote')
      
      // Revert optimistic update
      // This will be handled by the query invalidation in the mutation
      return false
    } finally {
      setSubmitting(false)
    }
  }, [postId, user, voteCount, submitVoteMutation])

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
    // Initial fetch will be handled by the query
    // This is now just for setup
  }, [postId])

  // Set up real-time subscription
  useEffect(() => {
    if (!postId) return
    
    // Initial fetch without debounce
    fetchVotes(true)
      .channel(`poll-votes-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_votes',
        filter: `post_id=eq.${postId}`
      }, () => {
        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        
        // Set a new timeout to debounce multiple rapid changes
        debounceTimeoutRef.current = setTimeout(() => {
          // Refetch will be handled by the query invalidation
        }, 300) // 300ms debounce delay
      })
      .subscribe()

    return () => {
      // Clean up timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      // Clean up subscription
    }
  }, [postId])

  return {
    userVote,
    voteCount,
    totalVotes,
    percentages: getPercentages(),
    loading,
    submitting,
    error,
    submitVote
  }
}

export default usePollVotes