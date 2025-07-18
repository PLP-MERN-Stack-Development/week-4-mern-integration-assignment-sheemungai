// categories.js - Routes for blog categories

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }
    
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
router.post(
  '/',
  [
    auth,
    [
      body('name').notEmpty().withMessage('Category name is required'),
      body('name').isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
      body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
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
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.',
        });
      }
      
      const { name, description, color } = req.body;
      
      // Check if category already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category already exists',
        });
      }
      
      const category = new Category({
        name,
        description,
        color: color || '#007bff',
      });
      
      await category.save();
      
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put(
  '/:id',
  [
    auth,
    [
      body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
      body('name').optional().isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
      body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
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
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.',
        });
      }
      
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }
      
      const { name, description, color } = req.body;
      
      // Check if new name already exists (excluding current category)
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            error: 'Category name already exists',
          });
        }
      }
      
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description, color },
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        data: updatedCategory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
      });
    }
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }
    
    // Check if category has posts
    if (category.postCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing posts',
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
