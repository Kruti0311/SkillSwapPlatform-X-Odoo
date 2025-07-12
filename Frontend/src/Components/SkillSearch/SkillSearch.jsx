import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SkillSearch.css';

const SkillSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('both');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const searchTypes = [
    { value: 'both', label: 'All Skills' },
    { value: 'offered', label: 'Skills Offered' },
    { value: 'wanted', label: 'Skills Wanted' }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a skill to search for');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/user/search?skill=${encodeURIComponent(searchTerm)}&type=${searchType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.data || []);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const viewUserProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  const sendSwapRequest = async (userId, offeredSkill, requestedSkill) => {
    try {
      const response = await fetch('/api/request/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receiverID: userId,
          offeredSkill: offeredSkill,
          requestedSkill: requestedSkill,
          message: `Hi! I'd like to swap ${offeredSkill} for ${requestedSkill}.`
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Swap request sent successfully!');
      } else {
        alert(data.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Request error:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  return (
    <div className="skill-search">
      <div className="search-header">
        <h2>Find Skill Partners</h2>
        <p>Search for users by skills they offer or want to learn</p>
      </div>

      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a skill (e.g., Photoshop, Excel, JavaScript)"
            className="search-input"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="search-btn"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="search-filters">
          <label>Search in:</label>
          <div className="filter-options">
            {searchTypes.map(type => (
              <label key={type.value} className="filter-option">
                <input
                  type="radio"
                  name="searchType"
                  value={type.value}
                  checked={searchType === type.value}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="search-results">
        {searchResults.length > 0 ? (
          <>
            <h3>Found {searchResults.length} user(s)</h3>
            <div className="results-grid">
              {searchResults.map((user) => (
                <div key={user._id} className="user-card">
                  <div className="user-header">
                    <img 
                      src={user.picture} 
                      alt={user.name}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p className="username">@{user.username}</p>
                      {user.location && (
                        <p className="location">📍 {user.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="user-rating">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`star ${star <= user.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="rating-text">
                      {user.rating || 0}/5 ({user.totalRatings || 0} reviews)
                    </span>
                  </div>

                  <div className="user-skills">
                    <div className="skills-section">
                      <h5>Offers:</h5>
                      <div className="skills-list">
                        {user.skillsProficientAt?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag offered">
                            {skill}
                          </span>
                        ))}
                        {user.skillsProficientAt?.length > 3 && (
                          <span className="skill-tag more">
                            +{user.skillsProficientAt.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="skills-section">
                      <h5>Wants to learn:</h5>
                      <div className="skills-list">
                        {user.skillsToLearn?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag wanted">
                            {skill}
                          </span>
                        ))}
                        {user.skillsToLearn?.length > 3 && (
                          <span className="skill-tag more">
                            +{user.skillsToLearn.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.availability && user.availability.length > 0 && (
                    <div className="user-availability">
                      <h5>Available:</h5>
                      <div className="availability-tags">
                        {user.availability.map(time => (
                          <span key={time} className="availability-tag">
                            {time.charAt(0).toUpperCase() + time.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="user-actions">
                    <button 
                      className="view-profile-btn"
                      onClick={() => viewUserProfile(user.username)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="swap-btn"
                      onClick={() => {
                        const offeredSkill = prompt('What skill can you offer?');
                        const requestedSkill = prompt('What skill do you want to learn?');
                        if (offeredSkill && requestedSkill) {
                          sendSwapRequest(user._id, offeredSkill, requestedSkill);
                        }
                      }}
                    >
                      Request Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          !loading && searchTerm && (
            <div className="no-results">
              <p>No users found with the skill "{searchTerm}"</p>
              <p>Try searching for a different skill or check your spelling</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SkillSearch; 