import { StudentMetrics } from '../models/studentMetrics.model.js';
import { User } from '../models/user.model.js';
import { GithubData } from '../models/githubData.model.js';
import { LeetCode } from '../models/leetcode.model.js';
import mongoose from 'mongoose';
import { calculateGitHubMetrics, calculateLeetCodeMetrics, updateStudentMetrics } from '../services/metrics.service.js';

export const updateMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { repos, leetcode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID format', 
        success: false 
      });
    }

    // Check if metrics already exist
    let existingMetrics = await StudentMetrics.findOne({ userId });
    
    try {
      const updatedMetrics = await updateStudentMetrics(userId, repos, leetcode);
      
      return res.status(existingMetrics ? 200 : 201).json({
        success: true,
        message: existingMetrics ? 'Metrics updated successfully' : 'Metrics created successfully',
        metrics: updatedMetrics
      });
    } catch (updateError) {
      console.error('Error in metrics update:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating metrics',
        error: updateError.message
      });
    }
  } catch (error) {
    console.error('Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating metrics',
      error: error.message
    });
  }
};

const processLanguages = (repos) => {
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(languages).map(([name, repoCount]) => ({
    name,
    repoCount,
    percentage: (repoCount / repos.length) * 100
  }));
};

export const getStudentMetrics = async (req, res) => {
  try {
    // Get all students with GitHub data
    const students = await User.find({ 
      role: 'student',
      githubID: { $exists: true, $ne: '' }
    })
    .select('firstName lastName githubID')
    .lean();

    // Get GitHub data for all students
    const githubData = await GithubData.find({
      userId: { $in: students.map(s => s._id) }
    }).lean();

    // Create a map of userId to GitHub data
    const githubDataMap = githubData.reduce((map, data) => {
      map[data.userId.toString()] = data;
      return map;
    }, {});

    // Calculate total and active students
    const totalStudents = students.length;
    const activeStudents = students.filter(s => {
      const data = githubDataMap[s._id.toString()];
      return data && data.repositories?.length > 0;
    }).length;

    // Calculate platform engagement percentages
    const platformEngagement = {
      github: ((activeStudents / totalStudents) * 100).toFixed(1),
      leetcode: "0.0" // Will be updated later
    };

    // Calculate top GitHub contributors
    const topGitHubStudents = students
      .map(student => {
        const data = githubDataMap[student._id.toString()];
        const totalCommits = data?.repositories?.reduce((sum, repo) => {
          return sum + (repo.commitCount || 0);
        }, 0) || 0;
        
        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          totalCommits
        };
      })
      .filter(student => student.totalCommits > 0)
      .sort((a, b) => b.totalCommits - a.totalCommits)
      .slice(0, 5);

    // Get LeetCode data for all students
    const leetcodeData = await LeetCode.find({
      userId: { $in: students.map(s => s._id) }
    }).lean();

    // Create a map of userId to LeetCode data
    const leetcodeDataMap = leetcodeData.reduce((map, data) => {
      map[data.userId.toString()] = data;
      return map;
    }, {});

    // Calculate top LeetCode performers
    const topLeetCodeStudents = students
      .map(student => {
        const data = leetcodeDataMap[student._id.toString()];
        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          problemsSolved: data?.completeProfile?.solvedProblem || 0
        };
      })
      .filter(student => student.problemsSolved > 0)
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 5);

    // Update LeetCode engagement percentage
    const leetcodeActiveStudents = leetcodeData.length;
    platformEngagement.leetcode = ((leetcodeActiveStudents / totalStudents) * 100).toFixed(1);

    res.json({
      success: true,
      metrics: {
        totalStudents,
        githubActiveStudents: activeStudents,
        leetcodeActiveStudents,
        platformEngagement,
        topGitHubStudents,
        topLeetCodeStudents
      }
    });
  } catch (error) {
    console.error('Error in getStudentMetrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student metrics',
      error: error.message
    });
  }
};

// New function for comprehensive student report
export const getStudentProgressReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // Optional: 'week', 'month', '3months', '6months', 'year'
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        success: false
      });
    }
    
    // Get student details
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({
        message: 'Student not found',
        success: false
      });
    }
    
    // Get metrics
    const metrics = await StudentMetrics.findOne({ userId });
    if (!metrics) {
      return res.status(404).json({
        message: 'No metrics found for this student',
        success: false
      });
    }
    
    // Apply period filter to metrics
    const filteredMetrics = applyPeriodFilter(metrics, period);
    
    // Generate trend analysis
    const trends = generateTrendAnalysis(metrics);
    
    // Generate summary
    const summary = {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        githubUsername: student.githubID,
        leetcodeUsername: student.leetCodeID,
        classId: student.classId ? student.classId[0] : null
      },
      codingActivity: {
        totalCommits: metrics.github.commits.total || 0,
        recentCommits: metrics.github.commits.recent90Days || 0,
        activeDaysLast30: metrics.github.consistency?.streak?.last30Days || 0,
        currentStreak: metrics.github.consistency?.streak?.current || 0,
        longestStreak: metrics.github.consistency?.streak?.longest || 0,
        weeklyAverage: metrics.github.consistency?.weeklyAverage || 0
      },
      repositories: {
        total: metrics.github.repositories.total || 0,
        active: metrics.github.repositories.active || 0,
        recentlyActive: metrics.github.repositories.recentlyActive || 0
      },
      leetcode: metrics.leetcode ? {
        totalSolved: metrics.leetcode.problemsSolved.total || 0,
        easySolved: metrics.leetcode.problemsSolved.easy || 0,
        mediumSolved: metrics.leetcode.problemsSolved.medium || 0,
        hardSolved: metrics.leetcode.problemsSolved.hard || 0,
        weeklyAverage: metrics.leetcode.consistency?.weeklyAverage || 0
      } : null,
      improvement: metrics.improvement ? {
        lastMonth: {
          commitIncrease: metrics.improvement.lastMonth.commitIncrease || 0,
          activeDaysIncrease: metrics.improvement.lastMonth.activeDaysIncrease || 0,
          newRepos: metrics.improvement.lastMonth.newRepos || 0,
          leetcodeIncrease: metrics.improvement.lastMonth.leetcodeIncrease || 0
        }
      } : null,
      trends,
      lastUpdated: metrics.lastUpdated
    };
    
    res.status(200).json({
      success: true,
      report: summary
    });
    
  } catch (error) {
    console.error('Progress Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating progress report',
      error: error.message
    });
  }
};

// Function to get class average metrics for comparison
export const getClassAverageMetrics = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        message: 'Invalid class ID format',
        success: false
      });
    }
    
    // Find all students in the class
    const students = await User.find({ 'classId': classId, role: 'Student' });
    if (!students || students.length === 0) {
      return res.status(404).json({
        message: 'No students found in this class',
        success: false
      });
    }
    
    // Get all their IDs
    const studentIds = students.map(student => student._id);
    
    // Get metrics for all students
    const allMetrics = await StudentMetrics.find({ userId: { $in: studentIds } });
    
    // Calculate average metrics
    const averageMetrics = calculateClassAverages(allMetrics);
    
    res.status(200).json({
      success: true,
      classSize: students.length,
      averageMetrics
    });
    
  } catch (error) {
    console.error('Class Average Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating class averages',
      error: error.message
    });
  }
};

// Function to compare student with class average
export const compareStudentWithClass = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        success: false
      });
    }
    
    // Get student metrics
    const studentMetrics = await StudentMetrics.findOne({ userId });
    if (!studentMetrics) {
      return res.status(404).json({
        message: 'No metrics found for this student',
        success: false
      });
    }
    
    // Get student details to find classId
    const student = await User.findById(userId);
    if (!student || !student.classId || student.classId.length === 0) {
      return res.status(404).json({
        message: 'Student not found or not assigned to a class',
        success: false
      });
    }
    
    const classId = student.classId[0];
    
    // Find all students in the class
    const classmates = await User.find({ 
      'classId': classId, 
      role: 'Student',
      _id: { $ne: userId } 
    });
    
    if (!classmates || classmates.length === 0) {
      return res.status(404).json({
        message: 'No other students found in this class for comparison',
        success: false
      });
    }
    
    // Get metrics for classmates
    const classmateIds = classmates.map(mate => mate._id);
    const classmateMetrics = await StudentMetrics.find({ userId: { $in: classmateIds } });
    
    // Calculate class averages
    const classAverages = calculateClassAverages(classmateMetrics);
    
    // Compare student with class average
    const comparison = compareMetrics(studentMetrics, classAverages);
    
    res.status(200).json({
      success: true,
      comparison,
      studentMetrics,
      classAverages
    });
    
  } catch (error) {
    console.error('Comparison Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing student with class average',
      error: error.message
    });
  }
};

// Helper function to apply period filter
const applyPeriodFilter = (metrics, period) => {
  if (!period) return metrics;
  
  const filteredMetrics = { ...metrics.toObject() };
  
  // Define date ranges
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return filteredMetrics;
  }
  
  // Filter daily activity
  if (filteredMetrics.dailyActivity && Array.isArray(filteredMetrics.dailyActivity)) {
    filteredMetrics.dailyActivity = filteredMetrics.dailyActivity.filter(day => 
      new Date(day.date) >= startDate
    );
  }
  
  // Filter weekly metrics
  if (filteredMetrics.weeklyMetrics && Array.isArray(filteredMetrics.weeklyMetrics)) {
    filteredMetrics.weeklyMetrics = filteredMetrics.weeklyMetrics.filter(week => 
      new Date(week.weekOf) >= startDate
    );
  }
  
  return filteredMetrics;
};

// Helper function to generate trend analysis
const generateTrendAnalysis = (metrics) => {
  if (!metrics.weeklyMetrics || !Array.isArray(metrics.weeklyMetrics) || metrics.weeklyMetrics.length < 2) {
    return {
      commitTrend: 'not enough data',
      activeDaysTrend: 'not enough data',
      overallTrend: 'not enough data'
    };
  }
  
  // Sort weeks by date
  const sortedWeeks = [...metrics.weeklyMetrics].sort((a, b) => 
    new Date(a.weekOf) - new Date(b.weekOf)
  );
  
  // Calculate trends over the last 4 weeks (if available)
  const recentWeeks = sortedWeeks.slice(-4);
  
  if (recentWeeks.length < 2) {
    return {
      commitTrend: 'not enough data',
      activeDaysTrend: 'not enough data',
      overallTrend: 'not enough data'
    };
  }
  
  // Calculate simple linear regression for commits
  const commitTrend = calculateTrend(
    recentWeeks.map((_, i) => i), 
    recentWeeks.map(week => week.commitCount)
  );
  
  // Calculate trend for active days
  const activeDaysTrend = calculateTrend(
    recentWeeks.map((_, i) => i), 
    recentWeeks.map(week => week.activeDays)
  );
  
  // Overall trend combines commits and active days
  const overallTrend = (commitTrend.slope + activeDaysTrend.slope) / 2;
  
  return {
    commitTrend: getTrendDescription(commitTrend.slope),
    activeDaysTrend: getTrendDescription(activeDaysTrend.slope),
    overallTrend: getTrendDescription(overallTrend)
  };
};

// Helper function to calculate trend (linear regression)
const calculateTrend = (xValues, yValues) => {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return { slope: 0, intercept: 0 };
  }
  
  const n = xValues.length;
  
  // Calculate means
  const meanX = xValues.reduce((sum, val) => sum + val, 0) / n;
  const meanY = yValues.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate slope
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - meanX) * (yValues[i] - meanY);
    denominator += Math.pow(xValues[i] - meanX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  return { slope, intercept };
};

// Helper function to get description for trend value
const getTrendDescription = (slope) => {
  if (slope > 0.5) return 'strong increase';
  if (slope > 0.1) return 'moderate increase';
  if (slope > 0) return 'slight increase';
  if (slope === 0) return 'stable';
  if (slope > -0.1) return 'slight decrease';
  if (slope > -0.5) return 'moderate decrease';
  return 'strong decrease';
};

// Helper function to calculate class averages
const calculateClassAverages = (metricsArray) => {
  if (!metricsArray || metricsArray.length === 0) {
    return null;
  }
  
  const studentsWithGithub = metricsArray.filter(m => 
    m.github && m.github.commits && m.github.commits.total > 0
  ).length;
  
  const studentsWithLeetcode = metricsArray.filter(m => 
    m.leetcode && m.leetcode.problemsSolved && m.leetcode.problemsSolved.total > 0
  ).length;
  
  const averages = {
    github: {
      commits: {
        total: metricsArray.reduce((sum, m) => sum + (m.github?.commits?.total || 0), 0) / studentsWithGithub || 0,
        recent90Days: metricsArray.reduce((sum, m) => sum + (m.github?.commits?.recent90Days || 0), 0) / studentsWithGithub || 0
      },
      repositories: {
        total: metricsArray.reduce((sum, m) => sum + (m.github?.repositories?.total || 0), 0) / studentsWithGithub || 0,
        active: metricsArray.reduce((sum, m) => sum + (m.github?.repositories?.active || 0), 0) / studentsWithGithub || 0
      },
      consistency: {
        streak: {
          current: metricsArray.reduce((sum, m) => sum + (m.github?.consistency?.streak?.current || 0), 0) / studentsWithGithub || 0,
          longest: metricsArray.reduce((sum, m) => sum + (m.github?.consistency?.streak?.longest || 0), 0) / studentsWithGithub || 0,
          last30Days: metricsArray.reduce((sum, m) => sum + (m.github?.consistency?.streak?.last30Days || 0), 0) / studentsWithGithub || 0
        },
        weeklyAverage: metricsArray.reduce((sum, m) => sum + (m.github?.consistency?.weeklyAverage || 0), 0) / studentsWithGithub || 0
      }
    },
    leetcode: studentsWithLeetcode > 0 ? {
      problemsSolved: {
        total: metricsArray.reduce((sum, m) => sum + (m.leetcode?.problemsSolved?.total || 0), 0) / studentsWithLeetcode,
        easy: metricsArray.reduce((sum, m) => sum + (m.leetcode?.problemsSolved?.easy || 0), 0) / studentsWithLeetcode,
        medium: metricsArray.reduce((sum, m) => sum + (m.leetcode?.problemsSolved?.medium || 0), 0) / studentsWithLeetcode,
        hard: metricsArray.reduce((sum, m) => sum + (m.leetcode?.problemsSolved?.hard || 0), 0) / studentsWithLeetcode
      }
    } : null
  };
  
  return averages;
};

// Helper function to compare student with class average
const compareMetrics = (studentMetrics, classAverages) => {
  if (!studentMetrics || !classAverages) {
    return null;
  }
  
  const getPercentageDifference = (studentValue, averageValue) => {
    if (!averageValue) return 0;
    return ((studentValue - averageValue) / averageValue) * 100;
  };
  
  return {
    github: {
      commits: {
        total: getPercentageDifference(
          studentMetrics.github?.commits?.total || 0, 
          classAverages.github?.commits?.total || 0
        ),
        recent90Days: getPercentageDifference(
          studentMetrics.github?.commits?.recent90Days || 0, 
          classAverages.github?.commits?.recent90Days || 0
        )
      },
      repositories: {
        total: getPercentageDifference(
          studentMetrics.github?.repositories?.total || 0, 
          classAverages.github?.repositories?.total || 0
        ),
        active: getPercentageDifference(
          studentMetrics.github?.repositories?.active || 0, 
          classAverages.github?.repositories?.active || 0
        )
      },
      consistency: {
        streak: {
          current: getPercentageDifference(
            studentMetrics.github?.consistency?.streak?.current || 0, 
            classAverages.github?.consistency?.streak?.current || 0
          ),
          longest: getPercentageDifference(
            studentMetrics.github?.consistency?.streak?.longest || 0, 
            classAverages.github?.consistency?.streak?.longest || 0
          ),
          last30Days: getPercentageDifference(
            studentMetrics.github?.consistency?.streak?.last30Days || 0, 
            classAverages.github?.consistency?.streak?.last30Days || 0
          )
        },
        weeklyAverage: getPercentageDifference(
          studentMetrics.github?.consistency?.weeklyAverage || 0, 
          classAverages.github?.consistency?.weeklyAverage || 0
        )
      }
    },
    leetcode: studentMetrics.leetcode && classAverages.leetcode ? {
      problemsSolved: {
        total: getPercentageDifference(
          studentMetrics.leetcode?.problemsSolved?.total || 0, 
          classAverages.leetcode?.problemsSolved?.total || 0
        ),
        easy: getPercentageDifference(
          studentMetrics.leetcode?.problemsSolved?.easy || 0, 
          classAverages.leetcode?.problemsSolved?.easy || 0
        ),
        medium: getPercentageDifference(
          studentMetrics.leetcode?.problemsSolved?.medium || 0, 
          classAverages.leetcode?.problemsSolved?.medium || 0
        ),
        hard: getPercentageDifference(
          studentMetrics.leetcode?.problemsSolved?.hard || 0, 
          classAverages.leetcode?.problemsSolved?.hard || 0
        )
      }
    } : null
  };
};