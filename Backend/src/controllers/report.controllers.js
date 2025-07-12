import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { Request } from "../models/request.model.js";
import { Chat } from "../models/chat.model.js";
import { Report } from "../models/report.model.js";
import { Rating } from "../models/rating.model.js";
import { PlatformMessage } from "../models/platformMessage.model.js";

export const createReport = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside createReport Controller function ********");
  const { username, reportedUsername, issue, issueDescription } = req.body;

  if (!username || !reportedUsername || !issue || !issueDescription) {
    return next(new ApiError(400, "Please fill all the details"));
  }

  const reporter = await User.findOne({ username: username });
  const reported = await User.findOne({ username: reportedUsername });

  if (!reporter || !reported) {
    return next(new ApiError(400, "User not found"));
  }

  const chat = await Chat.findOne({
    users: {
      $all: [reported._id, reporter._id],
    },
  });

  if (!chat) {
    return next(new ApiError(400, "User never interacted with the reported user so cannot report"));
  }

  const report = await Report.create({
    reporter: reporter._id,
    reported: reported._id,
    nature: issue,
    description: issueDescription,
  });

  res.status(201).json(new ApiResponse(201, report, "User Reported successfully"));
});

// Generate user activity report
const generateUserActivityReport = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('username name email isAdmin banned skillsProficientAt createdAt lastLoginAt');
  
  // Get additional stats for each user
  const userStats = await Promise.all(users.map(async (user) => {
    const sentRequests = await Request.countDocuments({ sender: user._id });
    const receivedRequests = await Request.countDocuments({ receiver: user._id });
    const connectedSent = await Request.countDocuments({ sender: user._id, status: 'Connected' });
    const connectedReceived = await Request.countDocuments({ receiver: user._id, status: 'Connected' });
    const ratingsGiven = await Rating.countDocuments({ rater: user._id });
    const ratingsReceived = await Rating.countDocuments({ ratedUser: user._id });
    const reportsFiled = await Report.countDocuments({ reportedBy: user._id });
    const reportsAgainst = await Report.countDocuments({ reportedUser: user._id });
    
    // Calculate success rates
    const totalSent = sentRequests + receivedRequests;
    const totalConnected = connectedSent + connectedReceived;
    const successRate = totalSent > 0 ? ((totalConnected / totalSent) * 100).toFixed(2) + '%' : '0%';
    
    // Calculate average rating received
    const userRatings = await Rating.find({ ratedUser: user._id });
    const avgRating = userRatings.length > 0 
      ? (userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length).toFixed(2)
      : 0;
    
    // Calculate days since registration
    const daysSinceRegistration = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate days since last login
    const daysSinceLastLogin = user.lastLoginAt 
      ? Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      ...user.toObject(),
      sentRequests,
      receivedRequests,
      connectedSent,
      connectedReceived,
      totalSwaps: sentRequests + receivedRequests,
      successRate,
      ratingsGiven,
      ratingsReceived,
      avgRatingReceived: avgRating,
      reportsFiled,
      reportsAgainst,
      daysSinceRegistration,
      daysSinceLastLogin,
      isActive: daysSinceLastLogin !== null && daysSinceLastLogin <= 30
    };
  }));

  // Calculate summary statistics
  const totalUsers = userStats.length;
  const activeUsers = userStats.filter(u => u.isActive).length;
  const bannedUsers = userStats.filter(u => u.banned).length;
  const adminUsers = userStats.filter(u => u.isAdmin).length;
  const usersWithSwaps = userStats.filter(u => u.totalSwaps > 0).length;
  const usersWithRatings = userStats.filter(u => u.ratingsReceived > 0).length;

  const summary = {
    totalUsers,
    activeUsers,
    bannedUsers,
    adminUsers,
    usersWithSwaps,
    usersWithRatings,
    activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
    bannedPercentage: totalUsers > 0 ? ((bannedUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
    swapParticipationRate: totalUsers > 0 ? ((usersWithSwaps / totalUsers) * 100).toFixed(2) + '%' : '0%'
  };

  return res.status(200).json(
    new ApiResponse(200, { summary, users: userStats }, "User activity report generated successfully")
  );
});

// Generate feedback logs report
const generateFeedbackReport = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({})
    .populate('rater', 'username name')
    .populate('ratedUser', 'username name')
    .sort({ createdAt: -1 });

  const reports = await Report.find({})
    .populate('reportedBy', 'username name')
    .populate('reportedUser', 'username name')
    .sort({ createdAt: -1 });

  const feedbackData = {
    ratings: ratings.map(rating => ({
      id: rating._id,
      raterUsername: rating.rater?.username || 'Unknown',
      raterName: rating.rater?.name || 'Unknown',
      ratedUsername: rating.ratedUser?.username || 'Unknown',
      ratedName: rating.ratedUser?.name || 'Unknown',
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.createdAt
    })),
    reports: reports.map(report => ({
      id: report._id,
      reporterUsername: report.reportedBy?.username || 'Unknown',
      reporterName: report.reportedBy?.name || 'Unknown',
      reportedUsername: report.reportedUser?.username || 'Unknown',
      reportedName: report.reportedUser?.name || 'Unknown',
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt
    }))
  };

  return res.status(200).json(
    new ApiResponse(200, feedbackData, "Feedback report generated successfully")
  );
});

// Generate swap statistics report
const generateSwapStatsReport = asyncHandler(async (req, res) => {
  const allRequests = await Request.find({})
    .populate('sender', 'username name')
    .populate('receiver', 'username name')
    .sort({ createdAt: -1 });

  // Calculate basic statistics
  const totalSwaps = allRequests.length;
  const pendingSwaps = allRequests.filter(req => req.status === 'Pending').length;
  const connectedSwaps = allRequests.filter(req => req.status === 'Connected').length;
  const rejectedSwaps = allRequests.filter(req => req.status === 'Rejected').length;

  // Calculate success rates
  const successRate = totalSwaps > 0 ? ((connectedSwaps / totalSwaps) * 100).toFixed(2) : 0;
  const pendingRate = totalSwaps > 0 ? ((pendingSwaps / totalSwaps) * 100).toFixed(2) : 0;
  const rejectionRate = totalSwaps > 0 ? ((rejectedSwaps / totalSwaps) * 100).toFixed(2) : 0;

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSwaps = allRequests.filter(req => req.createdAt >= thirtyDaysAgo);
  const recentConnected = recentSwaps.filter(req => req.status === 'Connected').length;
  const recentPending = recentSwaps.filter(req => req.status === 'Pending').length;

  // Monthly statistics for the last 12 months
  const monthlyStats = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const nextMonth = new Date(monthDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
    
    const monthRequests = allRequests.filter(req => 
      req.createdAt >= monthDate && req.createdAt < nextMonth
    );
    
    const monthConnected = monthRequests.filter(req => req.status === 'Connected').length;
    const monthSuccessRate = monthRequests.length > 0 ? ((monthConnected / monthRequests.length) * 100).toFixed(2) : 0;
    
    monthlyStats.push({
      month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      total: monthRequests.length,
      pending: monthRequests.filter(req => req.status === 'Pending').length,
      connected: monthConnected,
      rejected: monthRequests.filter(req => req.status === 'Rejected').length,
      successRate: monthSuccessRate + '%'
    });
  }

  // Top users by swap activity
  const userSwapCounts = {};
  const userSuccessCounts = {};
  
  allRequests.forEach(req => {
    const senderUsername = req.sender?.username || 'Unknown';
    const receiverUsername = req.receiver?.username || 'Unknown';
    
    userSwapCounts[senderUsername] = (userSwapCounts[senderUsername] || 0) + 1;
    userSwapCounts[receiverUsername] = (userSwapCounts[receiverUsername] || 0) + 1;
    
    if (req.status === 'Connected') {
      userSuccessCounts[senderUsername] = (userSuccessCounts[senderUsername] || 0) + 1;
      userSuccessCounts[receiverUsername] = (userSuccessCounts[receiverUsername] || 0) + 1;
    }
  });

  const topUsers = Object.entries(userSwapCounts)
    .map(([username, count]) => ({ 
      username, 
      swapCount: count,
      successCount: userSuccessCounts[username] || 0,
      successRate: userSuccessCounts[username] ? ((userSuccessCounts[username] / count) * 100).toFixed(2) + '%' : '0%'
    }))
    .sort((a, b) => b.swapCount - a.swapCount)
    .slice(0, 10);

  // Daily activity for the last 30 days
  const dailyStats = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000);
    
    const dayRequests = allRequests.filter(req => 
      req.createdAt >= dayStart && req.createdAt < dayEnd
    );
    
    dailyStats.push({
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: dayRequests.length,
      connected: dayRequests.filter(req => req.status === 'Connected').length,
      pending: dayRequests.filter(req => req.status === 'Pending').length,
      rejected: dayRequests.filter(req => req.status === 'Rejected').length
    });
  }

  const swapData = {
    summary: {
      totalSwaps,
      pendingSwaps,
      connectedSwaps,
      rejectedSwaps,
      successRate: successRate + '%',
      pendingRate: pendingRate + '%',
      rejectionRate: rejectionRate + '%',
      recentActivity: {
        last30Days: recentSwaps.length,
        recentConnected,
        recentPending
      }
    },
    monthlyStats,
    dailyStats,
    topUsers,
    detailedSwaps: allRequests.map(req => ({
      id: req._id,
      senderUsername: req.sender?.username || 'Unknown',
      senderName: req.sender?.name || 'Unknown',
      receiverUsername: req.receiver?.username || 'Unknown',
      receiverName: req.receiver?.name || 'Unknown',
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }))
  };

  return res.status(200).json(
    new ApiResponse(200, swapData, "Swap statistics report generated successfully")
  );
});

// Generate comprehensive platform report
const generatePlatformReport = asyncHandler(async (req, res) => {
  // User Statistics
  const totalUsers = await User.countDocuments({});
  const adminUsers = await User.countDocuments({ isAdmin: true });
  const bannedUsers = await User.countDocuments({ banned: true });
  const activeUsers = totalUsers - bannedUsers;
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  // Swap Statistics
  const totalSwaps = await Request.countDocuments({});
  const pendingSwaps = await Request.countDocuments({ status: 'Pending' });
  const connectedSwaps = await Request.countDocuments({ status: 'Connected' });
  const rejectedSwaps = await Request.countDocuments({ status: 'Rejected' });
  const swapsThisMonth = await Request.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  // Rating Statistics
  const totalRatings = await Rating.countDocuments({});
  const averageRating = await Rating.aggregate([
    { $group: { _id: null, avgRating: { $avg: "$rating" } } }
  ]);
  const ratingsThisMonth = await Rating.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  // Report Statistics
  const totalReports = await Report.countDocuments({});
  const pendingReports = await Report.countDocuments({ status: 'Pending' });
  const resolvedReports = await Report.countDocuments({ status: 'Resolved' });
  const reportsThisMonth = await Report.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
  });

  // Message Statistics
  const totalMessages = await PlatformMessage.countDocuments({});
  const activeMessages = await PlatformMessage.countDocuments({ isActive: true });

  // Top Skills Statistics
  const skillStats = await User.aggregate([
    { $unwind: "$skillsProficientAt" },
    { $group: { _id: "$skillsProficientAt", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Monthly Growth (last 6 months)
  const monthlyStats = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 1);
    
    const monthUsers = await User.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd }
    });
    
    const monthSwaps = await Request.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd }
    });
    
    const monthRatings = await Rating.countDocuments({
      createdAt: { $gte: monthStart, $lt: monthEnd }
    });
    
    monthlyStats.push({
      month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      newUsers: monthUsers,
      newSwaps: monthSwaps,
      newRatings: monthRatings
    });
  }

  const platformStats = {
    users: {
      total: totalUsers,
      admins: adminUsers,
      banned: bannedUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) + '%' : '0%'
    },
    swaps: {
      total: totalSwaps,
      pending: pendingSwaps,
      connected: connectedSwaps,
      rejected: rejectedSwaps,
      newThisMonth: swapsThisMonth,
      successRate: totalSwaps > 0 ? ((connectedSwaps / totalSwaps) * 100).toFixed(2) + '%' : '0%',
      pendingPercentage: totalSwaps > 0 ? ((pendingSwaps / totalSwaps) * 100).toFixed(2) + '%' : '0%'
    },
    feedback: {
      ratings: totalRatings,
      reports: totalReports,
      pendingReports: pendingReports,
      resolvedReports: resolvedReports,
      newRatingsThisMonth: ratingsThisMonth,
      newReportsThisMonth: reportsThisMonth,
      averageRating: averageRating[0]?.avgRating ? averageRating[0].avgRating.toFixed(2) : 0,
      resolutionRate: totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(2) + '%' : '0%'
    },
    communication: {
      platformMessages: totalMessages,
      activeMessages: activeMessages
    },
    analytics: {
      topSkills: skillStats,
      monthlyGrowth: monthlyStats
    }
  };

  return res.status(200).json(
    new ApiResponse(200, platformStats, "Platform report generated successfully")
  );
});

export {
  generateUserActivityReport,
  generateFeedbackReport,
  generateSwapStatsReport,
  generatePlatformReport
};
