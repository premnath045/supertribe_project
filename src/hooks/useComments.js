import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePostComments, useAddComment, useDeleteComment } from './useTanstackQuery'
import { commentsApi } from '../lib/queryClient'

export const useComments = (postId) => {
  const { user } = useAuth()

  // Fetch comments using TanStack Query
  const { 
    data: comments = [], 
    isLoading: loading, 
    error,
    refetch 
  } = usePostComments(postId, {
    commentsApi,
    enabled: !!postId
  })

  // Add a new comment
  const addCommentMutation = useAddComment(postId, {
    commentsApi,
    onError: (error) => {
      console.error('Error adding comment:', error)
    }
  })
  
  const addComment = useCallback(async (content) => {
    if (!user || !postId || !content.trim()) return
    
    return addCommentMutation.mutate({ 
      userId: user.id, 
      content: content.trim() 
    })
  }, [user, postId, addCommentMutation])

  // Delete a comment
  const deleteCommentMutation = useDeleteComment(postId, {
    commentsApi,
    onError: (error) => {
      console.error('Error deleting comment:', error)
    }
  })
  
  const deleteComment = useCallback(async (commentId) => {
    if (!user) return
    
    return deleteCommentMutation.mutate({ 
      commentId, 
      userId: user.id 
    })
  }, [user, deleteCommentMutation])

  return {
    comments,
    loading,
    error,
    submitting: addCommentMutation.isPending,
    addComment,
    deleteComment,
    refetch
  }
}