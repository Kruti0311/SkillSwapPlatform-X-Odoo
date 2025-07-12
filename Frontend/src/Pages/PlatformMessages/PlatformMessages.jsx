import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../../util/UserContext';
import './PlatformMessages.css';

const PlatformMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/platform-message');
      setMessages(data.data); // Extract the data from ApiResponse
    } catch (err) {
      setError('Failed to fetch platform messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get('/platform-message/unread-count');
      setUnreadCount(data.data.unreadCount); // Extract the data from ApiResponse
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.post(`/platform-message/${messageId}/read`);
      // Update the message to show it's been read
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), { user: user._id, readAt: new Date() }] }
          : msg
      ));
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark message as read');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return '#2196F3';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'success': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'urgent': return '#9C27B0';
      default: return '#FF9800';
    }
  };

  const isMessageRead = (message) => {
    return message.readBy && message.readBy.some(read => read.user === user._id);
  };

  if (loading) {
    return (
      <div className="platform-messages-container">
        <div className="loading">Loading platform messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="platform-messages-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="platform-messages-container">
      <div className="messages-header">
        <h1>Platform Messages</h1>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} unread
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">
          <p>No platform messages at the moment.</p>
        </div>
      ) : (
        <div className="messages-list">
          {(messages || []).map((message) => {
            const isRead = isMessageRead(message);
            const isExpired = message.expiresAt && new Date(message.expiresAt) < new Date();
            
            return (
              <div 
                key={message._id} 
                className={`message-card ${isRead ? 'read' : 'unread'} ${isExpired ? 'expired' : ''}`}
                onClick={() => !isRead && markAsRead(message._id)}
              >
                <div className="message-header">
                  <div className="message-type">
                    <span className="type-icon">{getTypeIcon(message.type)}</span>
                    <span 
                      className="type-badge"
                      style={{ backgroundColor: getTypeColor(message.type) }}
                    >
                      {message.type}
                    </span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(message.priority) }}
                    >
                      {message.priority}
                    </span>
                  </div>
                  <div className="message-meta">
                    <span className="message-date">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                    {message.expiresAt && (
                      <span className="expires-date">
                        Expires: {new Date(message.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="message-content">
                  <h3 className="message-title">{message.title}</h3>
                  <p className="message-text">{message.content}</p>
                </div>

                <div className="message-footer">
                  <span className="sent-by">Sent by: {message.sentBy?.username}</span>
                  {!isRead && (
                    <span className="unread-indicator">Click to mark as read</span>
                  )}
                  {isExpired && (
                    <span className="expired-indicator">This message has expired</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlatformMessages; 