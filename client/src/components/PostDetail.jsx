// PostDetail.jsx - Component for displaying a single post

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePost } from '../hooks/usePosts.js';
import { usePostActions } from '../hooks/usePosts.js';
import { useAuth } from '../context/AuthContext.jsx';
import CommentSection from './CommentSection.jsx';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { post, loading, error } = usePost(id);
  const { deletePost } = usePostActions();
  const { user, isAuthenticated } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setIsDeleting(true);
        await deletePost(id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="error-message">
        <p>Post not found.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canEdit = isAuthenticated && (user?.id === post.author?._id || user?.role === 'admin');

  return (
    <article className="post-detail">
      <header className="post-header">
        <div className="post-meta">
          <span className="category" style={{ color: post.category?.color }}>
            {post.category?.name}
          </span>
          <span className="date">{formatDate(post.createdAt)}</span>
          <span className="views">{post.viewCount} views</span>
        </div>
        
        <h1 className="post-title">{post.title}</h1>
        
        <div className="post-author">
          <div className="author-info">
            <img 
              src={`/api/uploads/${post.author?.avatar}`} 
              alt={post.author?.name}
              className="author-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.jpg';
              }}
            />
            <div>
              <p className="author-name">{post.author?.name}</p>
              <p className="author-email">{post.author?.email}</p>
            </div>
          </div>
          
          {canEdit && (
            <div className="post-actions">
              <button 
                onClick={() => navigate(`/posts/${post._id}/edit`)}
                className="btn btn-primary"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </header>
      
      {post.featuredImage && (
        <div className="post-featured-image">
          <img 
            src={`/api/uploads/${post.featuredImage}`} 
            alt={post.title}
            onError={(e) => {
              e.target.src = '/default-post.jpg';
            }}
          />
        </div>
      )}
      
      <div className="post-content">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          <h3>Tags:</h3>
          {post.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <CommentSection postId={post._id} comments={post.comments} />
    </article>
  );
};

export default PostDetail;
