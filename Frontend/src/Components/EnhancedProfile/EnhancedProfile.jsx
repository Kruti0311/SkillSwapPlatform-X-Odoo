import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EnhancedProfile.css';

const EnhancedProfile = ({ user, onUpdate }) => {
  const [location, setLocation] = useState(user?.location || '');
  const [availability, setAvailability] = useState(user?.availability || []);
  const [isPublic, setIsPublic] = useState(user?.isPublic !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const availabilityOptions = [
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'evenings', label: 'Evenings' },
    { value: 'mornings', label: 'Mornings' },
    { value: 'afternoons', label: 'Afternoons' }
  ];

  const handleAvailabilityChange = (option) => {
    setAvailability(prev => 
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update location
      if (location !== user?.location) {
        await fetch('/api/user/location', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ location })
        });
      }

      // Update availability
      if (JSON.stringify(availability) !== JSON.stringify(user?.availability)) {
        await fetch('/api/user/availability', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ availability })
        });
      }

      // Update visibility
      if (isPublic !== user?.isPublic) {
        await fetch('/api/user/visibility', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ isPublic })
        });
      }

      onUpdate && onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocation(user?.location || '');
    setAvailability(user?.availability || []);
    setIsPublic(user?.isPublic !== false);
    setIsEditing(false);
  };

  return (
    <div className="enhanced-profile">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        {!isEditing ? (
          <button 
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-sections">
        {/* Basic Info Section */}
        <div className="profile-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{user?.name}</span>
            </div>
            <div className="info-item">
              <label>Username:</label>
              <span>@{user?.username}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <label>Location:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your location"
                />
              ) : (
                <span>{location || 'Not specified'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="profile-section">
          <h3>Skills</h3>
          <div className="skills-container">
            <div className="skills-group">
              <h4>Skills I Offer:</h4>
              <div className="skills-list">
                {user?.skillsProficientAt?.map((skill, index) => (
                  <span key={index} className="skill-tag offered">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="skills-group">
              <h4>Skills I Want to Learn:</h4>
              <div className="skills-list">
                {user?.skillsToLearn?.map((skill, index) => (
                  <span key={index} className="skill-tag wanted">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="profile-section">
          <h3>Availability</h3>
          {isEditing ? (
            <div className="availability-options">
              {availabilityOptions.map(option => (
                <label key={option.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={availability.includes(option.value)}
                    onChange={() => handleAvailabilityChange(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ) : (
            <div className="availability-display">
              {availability.length > 0 ? (
                availability.map(time => (
                  <span key={time} className="availability-tag">
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </span>
                ))
              ) : (
                <span className="no-availability">No availability set</span>
              )}
            </div>
          )}
        </div>

        {/* Profile Visibility Section */}
        <div className="profile-section">
          <h3>Profile Visibility</h3>
          <div className="visibility-control">
            {isEditing ? (
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {isPublic ? 'Public Profile' : 'Private Profile'}
                </span>
              </label>
            ) : (
              <div className="visibility-status">
                <span className={`status-indicator ${isPublic ? 'public' : 'private'}`}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
                <p className="visibility-description">
                  {isPublic 
                    ? 'Your profile is visible to other users' 
                    : 'Your profile is hidden from other users'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Section */}
        <div className="profile-section">
          <h3>Rating & Reviews</h3>
          <div className="rating-info">
            <div className="rating-display">
              <span className="rating-score">{user?.rating || 0}</span>
              <span className="rating-max">/5</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    className={`star ${star <= (user?.rating || 0) ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="rating-count">
              Based on {user?.totalRatings || 0} reviews
            </p>
            <button 
              className="view-reviews-btn"
              onClick={() => navigate(`/rating/${user?.username}`)}
            >
              View Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfile; 