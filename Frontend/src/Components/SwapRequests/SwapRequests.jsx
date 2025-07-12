import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SwapRequests.css';

const SwapRequests = () => {
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/request/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(data.data || { sent: [], received: [] });
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch('/api/request/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Request accepted! You can now chat with this user.');
        fetchRequests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Accept error:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const response = await fetch('/api/request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Request rejected');
        fetchRequests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/request/delete/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Request deleted');
        fetchRequests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete request');
    }
  };

  const handleCompleteSwap = async (requestId) => {
    if (!confirm('Mark this swap as completed?')) {
      return;
    }

    try {
      const response = await fetch('/api/request/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Swap marked as completed! You can now rate this user.');
        fetchRequests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to complete swap');
      }
    } catch (error) {
      console.error('Complete error:', error);
      alert('Failed to complete swap');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'pending', text: 'Pending' },
      'Connected': { class: 'connected', text: 'Connected' },
      'Rejected': { class: 'rejected', text: 'Rejected' },
      'Completed': { class: 'completed', text: 'Completed' }
    };

    const config = statusConfig[status] || { class: 'default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="swap-requests">
        <div className="loading">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="swap-requests">
      <div className="requests-header">
        <h2>Swap Requests</h2>
        <p>Manage your skill swap requests and connections</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="requests-tabs">
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({requests.received.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({requests.sent.length})
        </button>
      </div>

      <div className="requests-content">
        {activeTab === 'received' ? (
          <div className="received-requests">
            {requests.received.length === 0 ? (
              <div className="no-requests">
                <p>No received requests</p>
              </div>
            ) : (
              requests.received.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="user-info">
                      <img 
                        src={request.sender?.picture} 
                        alt={request.sender?.name}
                        className="user-avatar"
                      />
                      <div>
                        <h4>{request.sender?.name}</h4>
                        <p className="username">@{request.sender?.username}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="swap-details">
                    <div className="swap-info">
                      <div className="skill-offer">
                        <span className="label">Offers:</span>
                        <span className="skill">{request.offeredSkill}</span>
                      </div>
                      <div className="skill-request">
                        <span className="label">Wants:</span>
                        <span className="skill">{request.requestedSkill}</span>
                      </div>
                    </div>
                    {request.message && (
                      <div className="request-message">
                        <p>{request.message}</p>
                      </div>
                    )}
                    <div className="request-date">
                      Sent on {formatDate(request.createdAt)}
                    </div>
                  </div>

                  <div className="request-actions">
                    {request.status === 'Pending' && (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptRequest(request.sender._id)}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectRequest(request.sender._id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'Connected' && (
                      <>
                        <button
                          className="chat-btn"
                          onClick={() => navigate('/chats')}
                        >
                          Open Chat
                        </button>
                        <button
                          className="complete-btn"
                          onClick={() => handleCompleteSwap(request._id)}
                        >
                          Mark Complete
                        </button>
                      </>
                    )}
                    {request.status === 'Completed' && (
                      <button
                        className="rate-btn"
                        onClick={() => navigate(`/rating/${request.sender?.username}`)}
                      >
                        Rate User
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="sent-requests">
            {requests.sent.length === 0 ? (
              <div className="no-requests">
                <p>No sent requests</p>
              </div>
            ) : (
              requests.sent.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="user-info">
                      <img 
                        src={request.receiver?.picture} 
                        alt={request.receiver?.name}
                        className="user-avatar"
                      />
                      <div>
                        <h4>{request.receiver?.name}</h4>
                        <p className="username">@{request.receiver?.username}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="swap-details">
                    <div className="swap-info">
                      <div className="skill-offer">
                        <span className="label">You offer:</span>
                        <span className="skill">{request.offeredSkill}</span>
                      </div>
                      <div className="skill-request">
                        <span className="label">You want:</span>
                        <span className="skill">{request.requestedSkill}</span>
                      </div>
                    </div>
                    {request.message && (
                      <div className="request-message">
                        <p>{request.message}</p>
                      </div>
                    )}
                    <div className="request-date">
                      Sent on {formatDate(request.createdAt)}
                    </div>
                  </div>

                  <div className="request-actions">
                    {request.status === 'Pending' && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRequest(request._id)}
                      >
                        Delete Request
                      </button>
                    )}
                    {request.status === 'Connected' && (
                      <>
                        <button
                          className="chat-btn"
                          onClick={() => navigate('/chats')}
                        >
                          Open Chat
                        </button>
                        <button
                          className="complete-btn"
                          onClick={() => handleCompleteSwap(request._id)}
                        >
                          Mark Complete
                        </button>
                      </>
                    )}
                    {request.status === 'Completed' && (
                      <button
                        className="rate-btn"
                        onClick={() => navigate(`/rating/${request.receiver?.username}`)}
                      >
                        Rate User
                      </button>
                    )}
                    {request.status === 'Rejected' && (
                      <span className="rejected-text">Request was rejected</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapRequests; 