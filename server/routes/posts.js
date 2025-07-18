// posts.js - Routes for blog posts

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by published status
    if (req.query.published !== undefined) {
      query.isPublished = req.query.published === 'true';
    } else {
      query.isPublished = true; // Default to published posts for public access
    }
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } },
      ];
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name email')
      .populate('category', 'name slug color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Post.countDocuments(query);
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar bio')
      .populate('category', 'name slug color')
      .populate('comments.user', 'name avatar');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }
    
    // Increment view count
    await post.incrementViewCount();
    
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('content').notEmpty().withMessage('Content is required'),
      body('category').notEmpty().withMessage('Category is required'),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { title, content, category, tags, excerpt, featuredImage, isPublished } = req.body;
      
      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Category not found',
        });
      }
      
      const post = new Post({
        title,
        content,
        category,
        author: req.user.id,
        tags: tags || [],
        excerpt,
        featuredImage,
        isPublished: isPublished || false,
      });
      
      await post.save();
      
      // Update category post count
      await Category.findByIdAndUpdate(category, { $inc: { postCount: 1 } });
      
      const populatedPost = await Post.findById(post._id)
        .populate('author', 'name email')
        .populate('category', 'name slug color');
      
      res.status(201).json({
        success: true,
        data: populatedPost,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('content').optional().notEmpty().withMessage('Content cannot be empty'),
      body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }
      
      // Check if user is the author or admin
      if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this post',
        });
      }
      
      const { title, content, category, tags, excerpt, featuredImage, isPublished } = req.body;
      
      // If category is being updated, check if it exists
      if (category && category !== post.category.toString()) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({
            success: false,
            error: 'Category not found',
          });
        }
        
        // Update post counts
        await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
        await Category.findByIdAndUpdate(category, { $inc: { postCount: 1 } });
      }
      
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          content,
          category,
          tags,
          excerpt,
          featuredImage,
          isPublished,
        },
        { new: true, runValidators: true }
      )
        .populate('author', 'name email')
        .populate('category', 'name slug color');
      
      res.json({
        success: true,
        data: updatedPost,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }
    
    // Check if user is the author or admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post',
      });
    }
    
    // Update category post count
    await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
    
    await Post.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post(
  '/:id/comments',
  [
    auth,
    [body('content').notEmpty().withMessage('Comment content is required')],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }
      
      await post.addComment(req.user.id, req.body.content);
      
      const updatedPost = await Post.findById(req.params.id)
        .populate('comments.user', 'name avatar');
      
      res.json({
        success: true,
        data: updatedPost.comments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;
