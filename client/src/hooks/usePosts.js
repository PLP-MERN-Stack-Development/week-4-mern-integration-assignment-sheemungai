// usePosts.js - Custom hook for post operations

import { useState, useEffect } from 'react';
import { postService } from '../services/api';

export const usePosts = (page = 1, limit = 10, category = null) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getAllPosts(page, limit, category);
      setPosts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, limit, category]);

  const refetch = () => {
    fetchPosts();
  };

  return {
    posts,
    loading,
    error,
    pagination,
    refetch,
  };
};

export const usePost = (id) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPost(id);
      setPost(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const refetch = () => {
    fetchPost();
  };

  return {
    post,
    loading,
    error,
    refetch,
  };
};

export const usePostActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPost = async (postData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.createPost(postData);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id, postData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.updatePost(id, postData);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.deletePost(id);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId, commentData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.addComment(postId, commentData);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPost,
    updatePost,
    deletePost,
    addComment,
    loading,
    error,
  };
};
