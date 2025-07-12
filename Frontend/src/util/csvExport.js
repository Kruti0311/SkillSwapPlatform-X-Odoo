// Utility functions for CSV export and file download

// Convert array of objects to CSV string
export const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key];
      // Handle different data types
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return `"${value}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

// Download CSV file
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Generate timestamp for filename
export const generateTimestamp = () => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/:/g, '-');
};

// Specific CSV converters for different report types

export const convertUserActivityToCSV = (userData) => {
  const headers = [
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'isAdmin', label: 'Is Admin' },
    { key: 'banned', label: 'Banned' },
    { key: 'skillsProficientAt', label: 'Skills' },
    { key: 'createdAt', label: 'Registration Date' },
    { key: 'lastLoginAt', label: 'Last Login' },
    { key: 'daysSinceRegistration', label: 'Days Since Registration' },
    { key: 'daysSinceLastLogin', label: 'Days Since Last Login' },
    { key: 'isActive', label: 'Is Active (30 days)' },
    { key: 'totalSwaps', label: 'Total Swaps' },
    { key: 'sentRequests', label: 'Sent Requests' },
    { key: 'receivedRequests', label: 'Received Requests' },
    { key: 'connectedSent', label: 'Connected Sent' },
    { key: 'connectedReceived', label: 'Connected Received' },
    { key: 'successRate', label: 'Success Rate' },
    { key: 'ratingsGiven', label: 'Ratings Given' },
    { key: 'ratingsReceived', label: 'Ratings Received' },
    { key: 'avgRatingReceived', label: 'Average Rating Received' },
    { key: 'reportsFiled', label: 'Reports Filed' },
    { key: 'reportsAgainst', label: 'Reports Against' }
  ];
  
  const csvData = userData.users.map(user => ({
    ...user,
    skillsProficientAt: Array.isArray(user.skillsProficientAt) ? user.skillsProficientAt.join(', ') : user.skillsProficientAt,
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '',
    isAdmin: user.isAdmin ? 'Yes' : 'No',
    banned: user.banned ? 'Yes' : 'No',
    isActive: user.isActive ? 'Yes' : 'No',
    daysSinceLastLogin: user.daysSinceLastLogin !== null ? user.daysSinceLastLogin : 'Never'
  }));
  
  return convertToCSV(csvData, headers);
};

export const convertFeedbackToCSV = (feedbackData) => {
  // Ratings CSV
  const ratingHeaders = [
    { key: 'id', label: 'Rating ID' },
    { key: 'raterUsername', label: 'Rater Username' },
    { key: 'raterName', label: 'Rater Name' },
    { key: 'ratedUsername', label: 'Rated Username' },
    { key: 'ratedName', label: 'Rated Name' },
    { key: 'rating', label: 'Rating' },
    { key: 'comment', label: 'Comment' },
    { key: 'createdAt', label: 'Date' }
  ];
  
  const ratingCSV = convertToCSV(
    feedbackData.ratings.map(rating => ({
      ...rating,
      createdAt: new Date(rating.createdAt).toLocaleDateString()
    })),
    ratingHeaders
  );
  
  // Reports CSV
  const reportHeaders = [
    { key: 'id', label: 'Report ID' },
    { key: 'reporterUsername', label: 'Reporter Username' },
    { key: 'reporterName', label: 'Reporter Name' },
    { key: 'reportedUsername', label: 'Reported Username' },
    { key: 'reportedName', label: 'Reported Name' },
    { key: 'reason', label: 'Reason' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' }
  ];
  
  const reportCSV = convertToCSV(
    feedbackData.reports.map(report => ({
      ...report,
      createdAt: new Date(report.createdAt).toLocaleDateString()
    })),
    reportHeaders
  );
  
  return { ratingCSV, reportCSV };
};

export const convertSwapStatsToCSV = (swapData) => {
  // Summary CSV
  const summaryHeaders = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' }
  ];
  
  const summaryCSV = convertToCSV([
    { metric: 'Total Swaps', value: swapData.summary.totalSwaps },
    { metric: 'Pending Swaps', value: swapData.summary.pendingSwaps },
    { metric: 'Connected Swaps', value: swapData.summary.connectedSwaps },
    { metric: 'Rejected Swaps', value: swapData.summary.rejectedSwaps },
    { metric: 'Success Rate', value: swapData.summary.successRate },
    { metric: 'Pending Rate', value: swapData.summary.pendingRate },
    { metric: 'Rejection Rate', value: swapData.summary.rejectionRate },
    { metric: 'Recent Activity (30 days)', value: swapData.summary.recentActivity.last30Days },
    { metric: 'Recent Connected (30 days)', value: swapData.summary.recentActivity.recentConnected },
    { metric: 'Recent Pending (30 days)', value: swapData.summary.recentActivity.recentPending }
  ], summaryHeaders);
  
  // Monthly Stats CSV
  const monthlyHeaders = [
    { key: 'month', label: 'Month' },
    { key: 'total', label: 'Total Swaps' },
    { key: 'pending', label: 'Pending' },
    { key: 'connected', label: 'Connected' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'successRate', label: 'Success Rate' }
  ];
  
  const monthlyCSV = convertToCSV(swapData.monthlyStats, monthlyHeaders);
  
  // Daily Stats CSV
  const dailyHeaders = [
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total Swaps' },
    { key: 'connected', label: 'Connected' },
    { key: 'pending', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' }
  ];
  
  const dailyCSV = convertToCSV(swapData.dailyStats, dailyHeaders);
  
  // Top Users CSV
  const topUsersHeaders = [
    { key: 'username', label: 'Username' },
    { key: 'swapCount', label: 'Total Swap Activity' },
    { key: 'successCount', label: 'Successful Swaps' },
    { key: 'successRate', label: 'Success Rate' }
  ];
  
  const topUsersCSV = convertToCSV(swapData.topUsers, topUsersHeaders);
  
  // Detailed Swaps CSV
  const detailedHeaders = [
    { key: 'id', label: 'Swap ID' },
    { key: 'senderUsername', label: 'Sender Username' },
    { key: 'senderName', label: 'Sender Name' },
    { key: 'receiverUsername', label: 'Receiver Username' },
    { key: 'receiverName', label: 'Receiver Name' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Updated Date' }
  ];
  
  const detailedCSV = convertToCSV(
    swapData.detailedSwaps.map(swap => ({
      ...swap,
      createdAt: new Date(swap.createdAt).toLocaleDateString(),
      updatedAt: new Date(swap.updatedAt).toLocaleDateString()
    })),
    detailedHeaders
  );
  
  return { summaryCSV, monthlyCSV, dailyCSV, topUsersCSV, detailedCSV };
};

export const convertPlatformStatsToCSV = (platformData) => {
  const headers = [
    { key: 'category', label: 'Category' },
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' }
  ];
  
  const csvData = [
    // Users
    { category: 'Users', metric: 'Total Users', value: platformData.users.total },
    { category: 'Users', metric: 'Admin Users', value: platformData.users.admins },
    { category: 'Users', metric: 'Banned Users', value: platformData.users.banned },
    { category: 'Users', metric: 'Active Users', value: platformData.users.active },
    { category: 'Users', metric: 'New Users This Month', value: platformData.users.newThisMonth },
    { category: 'Users', metric: 'Active Percentage', value: platformData.users.activePercentage },
    
    // Swaps
    { category: 'Swaps', metric: 'Total Swaps', value: platformData.swaps.total },
    { category: 'Swaps', metric: 'Pending Swaps', value: platformData.swaps.pending },
    { category: 'Swaps', metric: 'Connected Swaps', value: platformData.swaps.connected },
    { category: 'Swaps', metric: 'Rejected Swaps', value: platformData.swaps.rejected },
    { category: 'Swaps', metric: 'New Swaps This Month', value: platformData.swaps.newThisMonth },
    { category: 'Swaps', metric: 'Success Rate', value: platformData.swaps.successRate },
    { category: 'Swaps', metric: 'Pending Percentage', value: platformData.swaps.pendingPercentage },
    
    // Feedback
    { category: 'Feedback', metric: 'Total Ratings', value: platformData.feedback.ratings },
    { category: 'Feedback', metric: 'Total Reports', value: platformData.feedback.reports },
    { category: 'Feedback', metric: 'Pending Reports', value: platformData.feedback.pendingReports },
    { category: 'Feedback', metric: 'Resolved Reports', value: platformData.feedback.resolvedReports },
    { category: 'Feedback', metric: 'New Ratings This Month', value: platformData.feedback.newRatingsThisMonth },
    { category: 'Feedback', metric: 'New Reports This Month', value: platformData.feedback.newReportsThisMonth },
    { category: 'Feedback', metric: 'Average Rating', value: platformData.feedback.averageRating },
    { category: 'Feedback', metric: 'Report Resolution Rate', value: platformData.feedback.resolutionRate },
    
    // Communication
    { category: 'Communication', metric: 'Platform Messages', value: platformData.communication.platformMessages },
    { category: 'Communication', metric: 'Active Messages', value: platformData.communication.activeMessages }
  ];
  
  return convertToCSV(csvData, headers);
}; 