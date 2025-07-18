// CommentSection.jsx - Component for displaying and adding comments

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePostActions } from '../hooks/usePosts.js';

const CommentSection = ({ postId, comments = [] }) => {
  const { user, isAuthenticated } = useAuth();
  const { addComment, loading } = usePostActions();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    try {
      const response = await addComment(postId, { content: commentText });
      setLocalComments(response.data);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="comment-section">
      <h3>Comments ({localComments.length})</h3>
      
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="form-group">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              rows="4"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !commentText.trim()}
            className="btn btn-primary"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}
      
      {!isAuthenticated && (
        <p className="login-message">
          Please <a href="/login">login</a> to post a comment.
        </p>
      )}
      
      <div className="comments-list">
        {localComments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          localComments.map((comment) => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <div className="comment-author">
                  <img 
                    src={`/api/uploads/${comment.user?.avatar}`} 
                    alt={comment.user?.name}
                    className="comment-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.jpg';
                    }}
                  />
                  <div>
                    <p className="author-name">{comment.user?.name}</p>
                    <p className="comment-date">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="comment-content">
                <p>{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
