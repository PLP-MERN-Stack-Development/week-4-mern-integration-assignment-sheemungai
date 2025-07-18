// PostList.jsx - Component for displaying list of posts

import React from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts.js';

const PostList = ({ category = null, page = 1, limit = 10 }) => {
  const { posts, loading, error, pagination } = usePosts(page, limit, category);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading posts...</p>
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

  if (posts.length === 0) {
    return (
      <div className="no-posts">
        <p>No posts found.</p>
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

  return (
    <div className="post-list">
      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post._id} className="post-card">
            {post.featuredImage && (
              <div className="post-image">
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
              <div className="post-meta">
                <span className="category" style={{ color: post.category?.color }}>
                  {post.category?.name}
                </span>
                <span className="date">{formatDate(post.createdAt)}</span>
              </div>
              
              <h2 className="post-title">
                <Link to={`/posts/${post._id}`}>{post.title}</Link>
              </h2>
              
              {post.excerpt && (
                <p className="post-excerpt">{post.excerpt}</p>
              )}
              
              <div className="post-footer">
                <div className="author">
                  <span>By {post.author?.name}</span>
                </div>
                <div className="post-stats">
                  <span className="views">{post.viewCount} views</span>
                  <span className="comments">{post.comments?.length || 0} comments</span>
                </div>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          {pagination.page > 1 && (
            <Link 
              to={`?page=${pagination.page - 1}`}
              className="pagination-btn"
            >
              Previous
            </Link>
          )}
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          {pagination.page < pagination.pages && (
            <Link 
              to={`?page=${pagination.page + 1}`}
              className="pagination-btn"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;
