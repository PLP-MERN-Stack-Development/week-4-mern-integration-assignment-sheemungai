// Home.jsx - Home page component

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostList from '../components/PostList.jsx';
import { useCategories } from '../hooks/useCategories.jsx';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  
  const currentPage = parseInt(searchParams.get('page')) || 1;

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    newParams.delete('page'); // Reset to first page when changing category
    setSearchParams(newParams);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Our Blog</h1>
          <p>Discover amazing articles and stories from our community</p>
        </div>
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <div className="category-filter">
            <h3>Categories</h3>
            <div className="category-list">
              <button 
                className={selectedCategory === '' ? 'active' : ''}
                onClick={() => handleCategoryChange('')}
              >
                All Posts
              </button>
              {categories.map(category => (
                <button
                  key={category._id}
                  className={selectedCategory === category._id ? 'active' : ''}
                  onClick={() => handleCategoryChange(category._id)}
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  {category.name} ({category.postCount})
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="content-area">
          <PostList 
            category={selectedCategory || null}
            page={currentPage}
            limit={10}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
