import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../util/UserContext';
import { 
  convertUserActivityToCSV, 
  convertFeedbackToCSV, 
  convertSwapStatsToCSV, 
  convertPlatformStatsToCSV,
  downloadCSV,
  generateTimestamp 
} from '../util/csvExport';

const AdminDashboard = () => {
  const { user, logout } = useUser();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [swaps, setSwaps] = useState([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    expiresAt: ''
  });
  const [reportData, setReportData] = useState({
    userActivity: null,
    feedback: null,
    swapStats: null,
    platformStats: null
  });
  const [reportLoading, setReportLoading] = useState({
    userActivity: false,
    feedback: false,
    swapStats: false,
    platformStats: false
  });
  const [quickStats, setQuickStats] = useState(null);
  const [quickStatsLoading, setQuickStatsLoading] = useState(false);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'swaps') fetchSwaps();
    if (tab === 'messages') fetchMessages();
    if (tab === 'reports') fetchQuickStats();
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/user/admin/users');
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSwaps = async () => {
    setSwapLoading(true);
    setSwapError('');
    try {
      const { data } = await axios.get('/user/admin/swaps');
      setSwaps(data);
    } catch (err) {
      setSwapError('Failed to fetch swaps');
    } finally {
      setSwapLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessageLoading(true);
    setMessageError('');
    
    if (!user) {
      setMessageError('User not found. Please log in.');
      setMessageLoading(false);
      return;
    }
    
    if (!user.isAdmin) {
      setMessageError('Access denied. Admin privileges required.');
      setMessageLoading(false);
      return;
    }
    
    try {
      const { data } = await axios.get('/platform-message/admin');
      setMessages(data.data); // Extract the data from ApiResponse
    } catch (err) {
      if (err.response?.status === 403) {
        setMessageError('Access denied. Admin privileges required.');
      } else if (err.response?.status === 401) {
        setMessageError('Not authenticated. Please log in. Click logout and log in again.');
      } else {
        setMessageError(`Failed to fetch messages: ${err.message}`);
      }
    } finally {
      setMessageLoading(false);
    }
  };

  const handleBan = async (username) => {
    try {
      await axios.patch(`/user/admin/ban/${username}`);
      setUsers(users => users.map(u => u.username === username ? { ...u, banned: true } : u));
    } catch (err) {
      alert('Failed to ban user');
    }
  };
  const handleUnban = async (username) => {
    try {
      await axios.patch(`/user/admin/unban/${username}`);
      setUsers(users => users.map(u => u.username === username ? { ...u, banned: false } : u));
    } catch (err) {
      alert('Failed to unban user');
    }
  };

  const handleSwapStatus = async (id, status) => {
    try {
      await axios.patch(`/user/admin/swaps/${id}`, { status });
      setSwaps(swaps => swaps.map(s => s._id === id ? { ...s, status } : s));
    } catch {
      alert('Failed to update swap status');
    }
  };

  const handleCreateMessage = async () => {
    try {
      const messageData = {
        ...messageForm,
        expiresAt: messageForm.expiresAt || null
      };
      
      if (editingMessage) {
        const { data } = await axios.put(`/platform-message/${editingMessage._id}`, messageData);
        setMessages(messages => messages.map(m => m._id === editingMessage._id ? { ...m, ...data.data } : m));
      } else {
        const { data } = await axios.post('/platform-message', messageData);
        setMessages([data.data, ...messages]); // Extract data from ApiResponse
      }
      
      setShowMessageForm(false);
      setEditingMessage(null);
      setMessageForm({
        title: '',
        content: '',
        type: 'info',
        priority: 'medium',
        expiresAt: ''
      });
    } catch (err) {
      alert('Failed to save message');
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageForm({
      title: message.title,
      content: message.content,
      type: message.type,
      priority: message.priority,
      expiresAt: message.expiresAt ? new Date(message.expiresAt).toISOString().split('T')[0] : ''
    });
    setShowMessageForm(true);
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(`/platform-message/${messageId}`);
        setMessages(messages => messages.filter(m => m._id !== messageId));
      } catch (err) {
        alert('Failed to delete message');
      }
    }
  };

  const handleToggleMessageStatus = async (messageId, currentStatus) => {
    try {
      await axios.put(`/platform-message/${messageId}`, { isActive: !currentStatus });
      setMessages(messages => messages.map(m => m._id === messageId ? { ...m, isActive: !currentStatus } : m));
    } catch (err) {
      alert('Failed to update message status');
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

  // Report generation functions
  const generateUserActivityReport = async () => {
    setReportLoading(prev => ({ ...prev, userActivity: true }));
    try {
      const { data } = await axios.get('/report/admin/user-activity');
      setReportData(prev => ({ ...prev, userActivity: data.data }));
      const csv = convertUserActivityToCSV(data.data);
      const timestamp = generateTimestamp();
      downloadCSV(csv, `user-activity-report-${timestamp}.csv`);
    } catch (err) {
      console.error('Failed to generate user activity report:', err);
      alert('Failed to generate user activity report');
    } finally {
      setReportLoading(prev => ({ ...prev, userActivity: false }));
    }
  };

  const generateFeedbackReport = async () => {
    setReportLoading(prev => ({ ...prev, feedback: true }));
    try {
      const { data } = await axios.get('/report/admin/feedback');
      setReportData(prev => ({ ...prev, feedback: data.data }));
      const { ratingCSV, reportCSV } = convertFeedbackToCSV(data.data);
      const timestamp = generateTimestamp();
      downloadCSV(ratingCSV, `ratings-report-${timestamp}.csv`);
      downloadCSV(reportCSV, `reports-report-${timestamp}.csv`);
    } catch (err) {
      console.error('Failed to generate feedback report:', err);
      alert('Failed to generate feedback report');
    } finally {
      setReportLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  const generateSwapStatsReport = async () => {
    setReportLoading(prev => ({ ...prev, swapStats: true }));
    try {
      const { data } = await axios.get('/report/admin/swap-stats');
      setReportData(prev => ({ ...prev, swapStats: data.data }));
      const { summaryCSV, monthlyCSV, dailyCSV, topUsersCSV, detailedCSV } = convertSwapStatsToCSV(data.data);
      const timestamp = generateTimestamp();
      downloadCSV(summaryCSV, `swap-summary-${timestamp}.csv`);
      downloadCSV(monthlyCSV, `swap-monthly-stats-${timestamp}.csv`);
      downloadCSV(dailyCSV, `swap-daily-stats-${timestamp}.csv`);
      downloadCSV(topUsersCSV, `swap-top-users-${timestamp}.csv`);
      downloadCSV(detailedCSV, `swap-detailed-${timestamp}.csv`);
    } catch (err) {
      console.error('Failed to generate swap stats report:', err);
      alert('Failed to generate swap stats report');
    } finally {
      setReportLoading(prev => ({ ...prev, swapStats: false }));
    }
  };

  const generatePlatformReport = async () => {
    setReportLoading(prev => ({ ...prev, platformStats: true }));
    try {
      const { data } = await axios.get('/report/admin/platform');
      setReportData(prev => ({ ...prev, platformStats: data.data }));
      const csv = convertPlatformStatsToCSV(data.data);
      const timestamp = generateTimestamp();
      downloadCSV(csv, `platform-overview-${timestamp}.csv`);
    } catch (err) {
      console.error('Failed to generate platform report:', err);
      alert('Failed to generate platform report');
    } finally {
      setReportLoading(prev => ({ ...prev, platformStats: false }));
    }
  };

  // Fetch quick statistics for the reports overview
  const fetchQuickStats = async () => {
    setQuickStatsLoading(true);
    try {
      const { data } = await axios.get('/report/admin/platform');
      setQuickStats(data.data);
    } catch (err) {
      console.error('Failed to fetch quick stats:', err);
    } finally {
      setQuickStatsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Admin Dashboard</h1>
          {user && (
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Logged in as: {user.name} ({user.username}) - {user.isAdmin ? 'Admin' : 'User'}
            </p>
          )}
        </div>
        <button 
          onClick={logout}
          style={{ 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      <div style={{ margin: '1rem 0' }}>
        <button onClick={() => setTab('users')} style={{ marginRight: 10 }}>User Management</button>
        <button onClick={() => setTab('swaps')} style={{ marginRight: 10 }}>Swap Monitoring</button>
        <button onClick={() => setTab('messages')} style={{ marginRight: 10 }}>Platform Messages</button>
        <button onClick={() => setTab('reports')}>Reports</button>
      </div>
      {tab === 'reports' && (
        <div>
          <h2>Reports & Analytics</h2>
          
          {/* Quick Stats Overview */}
          <div style={{ marginBottom: '30px' }}>
            <h3>Quick Statistics Overview</h3>
            {quickStatsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading statistics...</p>
              </div>
            ) : quickStats ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginTop: '15px'
              }}>
                {/* User Statistics */}
                <div style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #2196f3' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>👥 Users</h4>
                  <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '5px 0' }}><strong>Total:</strong> {quickStats.users.total}</p>
                    <p style={{ margin: '5px 0' }}><strong>Active:</strong> {quickStats.users.active}</p>
                    <p style={{ margin: '5px 0' }}><strong>Banned:</strong> {quickStats.users.banned}</p>
                    <p style={{ margin: '5px 0' }}><strong>Admins:</strong> {quickStats.users.admins}</p>
                  </div>
                </div>

                {/* Swap Statistics */}
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #4caf50' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>🔄 Swaps</h4>
                  <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '5px 0' }}><strong>Total:</strong> {quickStats.swaps.total}</p>
                    <p style={{ margin: '5px 0' }}><strong>Connected:</strong> {quickStats.swaps.connected}</p>
                    <p style={{ margin: '5px 0' }}><strong>Pending:</strong> {quickStats.swaps.pending}</p>
                    <p style={{ margin: '5px 0' }}><strong>Success Rate:</strong> {quickStats.swaps.successRate}</p>
                  </div>
                </div>

                {/* Feedback Statistics */}
                <div style={{ 
                  backgroundColor: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #ff9800' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>⭐ Feedback</h4>
                  <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '5px 0' }}><strong>Ratings:</strong> {quickStats.feedback.ratings}</p>
                    <p style={{ margin: '5px 0' }}><strong>Reports:</strong> {quickStats.feedback.reports}</p>
                    <p style={{ margin: '5px 0' }}><strong>Avg Rating:</strong> {quickStats.feedback.averageRating}</p>
                    <p style={{ margin: '5px 0' }}><strong>Resolution Rate:</strong> {quickStats.feedback.resolutionRate}</p>
                  </div>
                </div>

                {/* Growth Statistics */}
                <div style={{ 
                  backgroundColor: '#f3e5f5', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #9c27b0' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>📈 Growth</h4>
                  <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '5px 0' }}><strong>New Users:</strong> {quickStats.users.newThisMonth}</p>
                    <p style={{ margin: '5px 0' }}><strong>New Swaps:</strong> {quickStats.swaps.newThisMonth}</p>
                    <p style={{ margin: '5px 0' }}><strong>New Ratings:</strong> {quickStats.feedback.newRatingsThisMonth}</p>
                    <p style={{ margin: '5px 0' }}><strong>Active %:</strong> {quickStats.users.activePercentage}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <p>Failed to load statistics. Please try refreshing the page.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            
            {/* User Activity Report */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3>User Activity Report</h3>
              <p>Download comprehensive user activity data including:</p>
              <ul>
                <li>User profiles and registration dates</li>
                <li>Swap activity (sent/received requests)</li>
                <li>Rating activity (given/received)</li>
                <li>Report activity (filed/against)</li>
                <li>Admin and ban status</li>
              </ul>
              <button 
                onClick={generateUserActivityReport}
                disabled={reportLoading.userActivity}
                style={{ 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px',
                  cursor: reportLoading.userActivity ? 'not-allowed' : 'pointer'
                }}
              >
                {reportLoading.userActivity ? 'Generating...' : 'Download User Activity Report'}
              </button>
            </div>

            {/* Feedback Report */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3>Feedback & Reports Log</h3>
              <p>Download detailed feedback and reporting data:</p>
              <ul>
                <li>All user ratings and comments</li>
                <li>User reports and their status</li>
                <li>Reporter and reported user details</li>
                <li>Timestamps and resolution status</li>
              </ul>
              <button 
                onClick={generateFeedbackReport}
                disabled={reportLoading.feedback}
                style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px',
                  cursor: reportLoading.feedback ? 'not-allowed' : 'pointer'
                }}
              >
                {reportLoading.feedback ? 'Generating...' : 'Download Feedback Report'}
              </button>
            </div>

            {/* Swap Statistics Report */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3>Swap Statistics Report</h3>
              <p>Download comprehensive swap analytics:</p>
              <ul>
                <li>Overall swap statistics and success rates</li>
                <li>Monthly swap trends (last 12 months)</li>
                <li>Top users by swap activity</li>
                <li>Detailed swap records with status</li>
              </ul>
              <button 
                onClick={generateSwapStatsReport}
                disabled={reportLoading.swapStats}
                style={{ 
                  backgroundColor: '#FF9800', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px',
                  cursor: reportLoading.swapStats ? 'not-allowed' : 'pointer'
                }}
              >
                {reportLoading.swapStats ? 'Generating...' : 'Download Swap Statistics'}
              </button>
            </div>

            {/* Platform Overview Report */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3>Platform Overview Report</h3>
              <p>Download platform-wide statistics:</p>
              <ul>
                <li>Total users, admins, and banned users</li>
                <li>Overall swap statistics</li>
                <li>Feedback and communication metrics</li>
                <li>Platform health indicators</li>
              </ul>
              <button 
                onClick={generatePlatformReport}
                disabled={reportLoading.platformStats}
                style={{ 
                  backgroundColor: '#9C27B0', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px',
                  cursor: reportLoading.platformStats ? 'not-allowed' : 'pointer'
                }}
              >
                {reportLoading.platformStats ? 'Generating...' : 'Download Platform Overview'}
              </button>
            </div>
          </div>

          {/* Report Preview Section */}
          {(reportData.userActivity || reportData.feedback || reportData.swapStats || reportData.platformStats) && (
            <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3>Recent Report Data Preview</h3>
              {reportData.userActivity && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>User Activity Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <p><strong>Total Users:</strong> {reportData.userActivity.summary.totalUsers}</p>
                    <p><strong>Active Users:</strong> {reportData.userActivity.summary.activeUsers} ({reportData.userActivity.summary.activePercentage})</p>
                    <p><strong>Admin Users:</strong> {reportData.userActivity.summary.adminUsers}</p>
                    <p><strong>Banned Users:</strong> {reportData.userActivity.summary.bannedUsers} ({reportData.userActivity.summary.bannedPercentage})</p>
                    <p><strong>Users with Swaps:</strong> {reportData.userActivity.summary.usersWithSwaps} ({reportData.userActivity.summary.swapParticipationRate})</p>
                    <p><strong>Users with Ratings:</strong> {reportData.userActivity.summary.usersWithRatings}</p>
                  </div>
                </div>
              )}
              {reportData.swapStats && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Swap Statistics Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <p><strong>Total Swaps:</strong> {reportData.swapStats.summary.totalSwaps}</p>
                    <p><strong>Success Rate:</strong> {reportData.swapStats.summary.successRate}</p>
                    <p><strong>Pending Rate:</strong> {reportData.swapStats.summary.pendingRate}</p>
                    <p><strong>Rejection Rate:</strong> {reportData.swapStats.summary.rejectionRate}</p>
                    <p><strong>Recent Activity (30 days):</strong> {reportData.swapStats.summary.recentActivity.last30Days}</p>
                    <p><strong>Recent Connected:</strong> {reportData.swapStats.summary.recentActivity.recentConnected}</p>
                  </div>
                </div>
              )}
              {reportData.platformStats && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Platform Overview</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <p><strong>Total Users:</strong> {reportData.platformStats.users.total}</p>
                    <p><strong>Active Users:</strong> {reportData.platformStats.users.active} ({reportData.platformStats.users.activePercentage})</p>
                    <p><strong>Banned Users:</strong> {reportData.platformStats.users.banned}</p>
                    <p><strong>New Users This Month:</strong> {reportData.platformStats.users.newThisMonth}</p>
                    <p><strong>Total Swaps:</strong> {reportData.platformStats.swaps.total}</p>
                    <p><strong>Success Rate:</strong> {reportData.platformStats.swaps.successRate}</p>
                    <p><strong>Total Ratings:</strong> {reportData.platformStats.feedback.ratings}</p>
                    <p><strong>Average Rating:</strong> {reportData.platformStats.feedback.averageRating}</p>
                    <p><strong>Total Reports:</strong> {reportData.platformStats.feedback.reports}</p>
                    <p><strong>Resolution Rate:</strong> {reportData.platformStats.feedback.resolutionRate}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {tab === 'users' && (
        <div>
          <h2>User Management</h2>
          {loading ? <p>Loading users...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Admin</th>
                  <th>Banned</th>
                  <th>Skills</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                    <td>{user.banned ? 'Yes' : 'No'}</td>
                    <td>{user.skillsProficientAt && user.skillsProficientAt.join(', ')}</td>
                    <td>
                      {user.banned ? (
                        <button onClick={() => handleUnban(user.username)} style={{ color: 'green' }}>Unban</button>
                      ) : (
                        <button onClick={() => handleBan(user.username)} style={{ color: 'red' }}>Ban</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'swaps' && (
        <div>
          <h2>Swap Monitoring</h2>
          {swapLoading ? <p>Loading swaps...</p> : swapError ? <p style={{ color: 'red' }}>{swapError}</p> : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map(swap => (
                  <tr key={swap._id}>
                    <td>{swap.sender?.username} ({swap.sender?.name})</td>
                    <td>{swap.receiver?.username} ({swap.receiver?.name})</td>
                    <td>{swap.status}</td>
                    <td>
                      {['Pending', 'Connected', 'Rejected'].map(st => (
                        <button
                          key={st}
                          disabled={swap.status === st}
                          onClick={() => handleSwapStatus(swap._id, st)}
                          style={{ marginRight: 5 }}
                        >
                          {st}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'messages' && (
        <div>
          <h2>Platform Messages</h2>
          <button 
            onClick={() => {
              setShowMessageForm(true);
              setEditingMessage(null);
              setMessageForm({
                title: '',
                content: '',
                type: 'info',
                priority: 'medium',
                expiresAt: ''
              });
            }}
            style={{ 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Create New Message
          </button>
          
          {messageLoading ? <p>Loading messages...</p> : messageError ? <p style={{ color: 'red' }}>{messageError}</p> : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Sent By</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(messages || []).map(message => (
                  <tr key={message._id}>
                    <td>{message.title}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: getTypeColor(message.type), 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '3px' 
                      }}>
                        {message.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: getPriorityColor(message.priority), 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '3px' 
                      }}>
                        {message.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: message.isActive ? '#4CAF50' : '#F44336', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '3px' 
                      }}>
                        {message.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{message.sentBy?.username}</td>
                    <td>{new Date(message.createdAt).toLocaleDateString()}</td>
                    <td>{message.expiresAt ? new Date(message.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <button onClick={() => handleEditMessage(message)} style={{ marginRight: 5, backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>Edit</button>
                      <button onClick={() => handleToggleMessageStatus(message._id, message.isActive)} style={{ marginRight: 5, backgroundColor: message.isActive ? '#FF9800' : '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>
                        {message.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteMessage(message._id)} style={{ backgroundColor: '#F44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Message Form Modal */}
      {showMessageForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3>{editingMessage ? 'Edit Message' : 'Create New Message'}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label>Title:</label>
              <input
                type="text"
                value={messageForm.title}
                onChange={(e) => setMessageForm({...messageForm, title: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Content:</label>
              <textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', height: '100px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Type:</label>
              <select
                value={messageForm.type}
                onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Priority:</label>
              <select
                value={messageForm.priority}
                onChange={(e) => setMessageForm({...messageForm, priority: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Expires At (optional):</label>
              <input
                type="date"
                value={messageForm.expiresAt}
                onChange={(e) => setMessageForm({...messageForm, expiresAt: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  setShowMessageForm(false);
                  setEditingMessage(null);
                  setMessageForm({
                    title: '',
                    content: '',
                    type: 'info',
                    priority: 'medium',
                    expiresAt: ''
                  });
                }}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMessage}
                disabled={!messageForm.title || !messageForm.content}
                style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                {editingMessage ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 