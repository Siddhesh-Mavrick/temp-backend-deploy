import { StudentMetrics } from '../models/studentMetrics.model.js';

const calculateActivityScore = (metrics) => {
  // Simple scoring logic - can be enhanced
  const daysActive = metrics.recentActivity.activeDays.size;
  const recentCommits = metrics.recentActivity.commits;
  return Math.min(100, ((daysActive * 3) + (recentCommits * 2)) / 5);
};

const calculateCodeQualityScore = (metrics) => {
  const commitFrequencyScore = Math.min((metrics.recentActivity.commits / 150) * 40, 40);
  const activeDaysScore = (metrics.recentActivity.activeDays.size / 90) * 30;
  const reposDiversityScore = (metrics.recentActivity.repositories.size / 5) * 30;
  return Math.min(commitFrequencyScore + activeDaysScore + reposDiversityScore, 100);
};

const calculateImpactScore = (metrics) => {
  // Simple scoring logic - can be enhanced
  const stars = metrics.impact.totalStars;
  const forks = metrics.impact.totalForks;
  return Math.min(100, ((stars * 3) + (forks * 2)) / 5);
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

const generateCareerInsights = (repos) => {
  const languageToDomainsMap = {
    'JavaScript': ['Web Development', 'Full Stack Development', 'Frontend Development'],
    'Python': ['Data Science', 'Machine Learning', 'Backend Development'],
    'Java': ['Enterprise Development', 'Android Development', 'Backend Development'],
    'C++': ['Game Development', 'Systems Programming', 'Performance-Critical Applications'],
    'HTML': ['Frontend Development', 'Web Design', 'UI Development'],
    'TypeScript': ['Modern Web Development', 'Enterprise Applications', 'Type-Safe Programming']
  };

  const languages = processLanguages(repos);
  const topLanguages = languages
    .sort((a, b) => b.repoCount - a.repoCount)
    .slice(0, 3)
    .map(lang => lang.name);

  const recommendedDomains = new Set();
  topLanguages.forEach(lang => {
    const domains = languageToDomainsMap[lang] || [];
    domains.forEach(domain => recommendedDomains.add(domain));
  });

  return {
    topDomains: Array.from(recommendedDomains).slice(0, 3),
    recommendedPaths: Array.from(recommendedDomains).slice(0, 3)
  };
};

const generateSuggestions = (scores) => {
  const suggestions = [];

  if (scores.activity < 50) {
    suggestions.push({
      category: 'Activity',
      points: [
        'Try to commit code more regularly',
        'Contribute to more repositories',
        'Aim for at least 3-4 commits per week'
      ]
    });
  }

  if (scores.quality < 50) {
    suggestions.push({
      category: 'Code Quality',
      points: [
        'Make smaller, more focused commits',
        'Add meaningful commit messages',
        'Review your code before committing'
      ]
    });
  }

  if (scores.impact < 50) {
    suggestions.push({
      category: 'Impact',
      points: [
        'Contribute to open source projects',
        'Share your projects on social media',
        'Write documentation for your projects'
      ]
    });
  }

  return suggestions;
};

const calculateDailyActivity = (repos, leetcodeData = null, existingMetrics = null) => {
  if (!repos || !Array.isArray(repos)) return [];

  // Create a map of existing daily activity by date for quick lookup
  const existingDailyMap = new Map();
  if (existingMetrics?.dailyActivity && Array.isArray(existingMetrics.dailyActivity)) {
    existingMetrics.dailyActivity.forEach(day => {
      const dateStr = new Date(day.date).toISOString().split('T')[0];
      existingDailyMap.set(dateStr, day);
    });
  }

  // Process all commits to build daily activity
  const dailyActivityMap = new Map();
  
  repos.forEach(repo => {
    if (repo.commits && Array.isArray(repo.commits)) {
      repo.commits.forEach(commit => {
        const dateStr = new Date(commit.date).toISOString().split('T')[0];
        if (!dailyActivityMap.has(dateStr)) {
          dailyActivityMap.set(dateStr, {
            date: new Date(dateStr),
            commitCount: 0,
            repositoriesWorkedOn: new Set()
          });
        }
        
        const day = dailyActivityMap.get(dateStr);
        day.commitCount++;
        day.repositoriesWorkedOn.add(repo.name);
      });
    }
  });

  // Add LeetCode activity if available (hypothetical example, would need actual data)
  if (leetcodeData?.submissions) {
    leetcodeData.submissions.forEach(submission => {
      const dateStr = new Date(submission.timestamp).toISOString().split('T')[0];
      if (!dailyActivityMap.has(dateStr)) {
        dailyActivityMap.set(dateStr, {
          date: new Date(dateStr),
          commitCount: 0,
          repositoriesWorkedOn: new Set(),
          leetcodeProblems: 0
        });
      }
      
      const day = dailyActivityMap.get(dateStr);
      day.leetcodeProblems = (day.leetcodeProblems || 0) + 1;
    });
  }

  // Convert to array and format
  return Array.from(dailyActivityMap.entries()).map(([date, data]) => ({
    date: data.date,
    commitCount: data.commitCount,
    repositoriesWorkedOn: Array.from(data.repositoriesWorkedOn),
    leetcodeProblems: data.leetcodeProblems || 0
  }));
};

const calculateWeeklyMetrics = (dailyActivity) => {
  if (!dailyActivity || !Array.isArray(dailyActivity) || dailyActivity.length === 0) {
    return [];
  }

  const weeklyMap = new Map();
  
  dailyActivity.forEach(day => {
    const date = new Date(day.date);
    // Get the start of the week (Sunday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        weekOf: weekStart,
        commitCount: 0,
        activeDays: new Set(),
        repositoriesWorkedOn: new Set(),
        leetcodeProblems: 0
      });
    }
    
    const week = weeklyMap.get(weekKey);
    week.commitCount += day.commitCount;
    week.activeDays.add(new Date(day.date).toISOString().split('T')[0]);
    day.repositoriesWorkedOn.forEach(repo => week.repositoriesWorkedOn.add(repo));
    week.leetcodeProblems += day.leetcodeProblems || 0;
  });
  
  // Convert to array and format
  return Array.from(weeklyMap.entries()).map(([date, data]) => ({
    weekOf: data.weekOf,
    commitCount: data.commitCount,
    activeDays: data.activeDays.size,
    repositoriesWorkedOn: Array.from(data.repositoriesWorkedOn),
    leetcodeProblems: data.leetcodeProblems
  })).sort((a, b) => new Date(a.weekOf) - new Date(b.weekOf));
};

const calculateConsistencyMetrics = (dailyActivity) => {
  if (!dailyActivity || !Array.isArray(dailyActivity) || dailyActivity.length === 0) {
    return {
      streak: {
        current: 0,
        longest: 0,
        last30Days: 0
      },
      weeklyAverage: 0
    };
  }

  // Sort daily activity by date
  const sortedActivity = [...dailyActivity].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  let currentStreak = 0;
  let longestStreak = 0;
  let last30DaysStreak = 0;
  
  // Calculate streaks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  let previousDate = null;
  sortedActivity.forEach(day => {
    const date = new Date(day.date);
    date.setHours(0, 0, 0, 0);
    
    // Skip future dates
    if (date > today) return;
    
    const isConsecutive = previousDate && 
      (date.getTime() - previousDate.getTime() === 86400000); // 1 day in ms
    
    if (isConsecutive || !previousDate) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 1; // Reset but count today
    }
    
    // Check if in last 30 days
    if (date >= thirtyDaysAgo) {
      last30DaysStreak++;
    }
    
    previousDate = date;
  });
  
  // If the last activity is not today, reset current streak
  if (previousDate && previousDate < today) {
    const diffDays = Math.floor((today - previousDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      currentStreak = 0;
    }
  }
  
  // Calculate weekly average (last 4 weeks)
  const recentActivities = sortedActivity.filter(day => {
    const date = new Date(day.date);
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);
    return date >= fourWeeksAgo;
  });
  
  // Group by week
  const weeklyMap = new Map();
  recentActivities.forEach(day => {
    const date = new Date(day.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, 0);
    }
    
    weeklyMap.set(weekKey, weeklyMap.get(weekKey) + 1);
  });
  
  const weeklyAverage = weeklyMap.size > 0 
    ? Array.from(weeklyMap.values()).reduce((sum, count) => sum + count, 0) / weeklyMap.size 
    : 0;
  
  return {
    streak: {
      current: currentStreak,
      longest: longestStreak,
      last30Days: last30DaysStreak
    },
    weeklyAverage: Math.round(weeklyAverage * 10) / 10 // Round to 1 decimal
  };
};

const calculateImprovementMetrics = (weeklyMetrics) => {
  if (!weeklyMetrics || !Array.isArray(weeklyMetrics) || weeklyMetrics.length < 5) {
    return {
      lastMonth: {
        commitIncrease: 0,
        activeDaysIncrease: 0,
        newRepos: 0,
        leetcodeIncrease: 0
      }
    };
  }
  
  // Sort by week
  const sortedWeekly = [...weeklyMetrics].sort((a, b) => 
    new Date(b.weekOf) - new Date(a.weekOf)
  );
  
  // Get the last 4 weeks and the 4 weeks before that
  const lastFourWeeks = sortedWeekly.slice(0, 4);
  const previousFourWeeks = sortedWeekly.slice(4, 8);
  
  if (lastFourWeeks.length === 0 || previousFourWeeks.length === 0) {
    return {
      lastMonth: {
        commitIncrease: 0,
        activeDaysIncrease: 0,
        newRepos: 0,
        leetcodeIncrease: 0
      }
    };
  }
  
  // Calculate metrics for each period
  const lastFourWeeksMetrics = {
    commits: lastFourWeeks.reduce((sum, week) => sum + week.commitCount, 0),
    activeDays: lastFourWeeks.reduce((sum, week) => sum + week.activeDays, 0),
    repos: new Set(),
    leetcode: lastFourWeeks.reduce((sum, week) => sum + week.leetcodeProblems, 0)
  };
  
  lastFourWeeks.forEach(week => {
    week.repositoriesWorkedOn.forEach(repo => lastFourWeeksMetrics.repos.add(repo));
  });
  
  const previousFourWeeksMetrics = {
    commits: previousFourWeeks.reduce((sum, week) => sum + week.commitCount, 0),
    activeDays: previousFourWeeks.reduce((sum, week) => sum + week.activeDays, 0),
    repos: new Set(),
    leetcode: previousFourWeeks.reduce((sum, week) => sum + week.leetcodeProblems, 0)
  };
  
  previousFourWeeks.forEach(week => {
    week.repositoriesWorkedOn.forEach(repo => previousFourWeeksMetrics.repos.add(repo));
  });
  
  // Calculate increases
  const commitIncrease = lastFourWeeksMetrics.commits - previousFourWeeksMetrics.commits;
  const activeDaysIncrease = lastFourWeeksMetrics.activeDays - previousFourWeeksMetrics.activeDays;
  
  // Calculate new repos (ones in current period not in previous)
  const newRepos = [...lastFourWeeksMetrics.repos].filter(
    repo => !previousFourWeeksMetrics.repos.has(repo)
  ).length;
  
  const leetcodeIncrease = lastFourWeeksMetrics.leetcode - previousFourWeeksMetrics.leetcode;
  
  return {
    lastMonth: {
      commitIncrease,
      activeDaysIncrease,
      newRepos,
      leetcodeIncrease
    }
  };
};

export const calculateGitHubMetrics = (repos) => {
  if (!repos || !Array.isArray(repos)) {
    return {
      raw: {
        recentActivity: {
          commits: 0,
          activeDays: new Set(),
          repositories: new Set()
        },
        impact: {
          totalStars: 0,
          totalForks: 0
        }
      },
      scores: {
        activity: 0,
        impact: 0
      }
    };
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
  
  const metrics = {
    recentActivity: {
      commits: 0,
      activeDays: new Set(),
      repositories: new Set()
    },
    impact: {
      totalStars: 0,
      totalForks: 0
    }
  };

  repos.forEach(repo => {
    if (repo.commits && Array.isArray(repo.commits)) {
      repo.commits.forEach(commit => {
        const commitDate = new Date(commit.date);
        if (commitDate >= ninetyDaysAgo) {
          metrics.recentActivity.commits++;
          metrics.recentActivity.activeDays.add(commit.date.split('T')[0]);
          metrics.recentActivity.repositories.add(repo.name);
        }
      });
    }

    metrics.impact.totalStars += repo.stargazers_count || 0;
    metrics.impact.totalForks += repo.forks_count || 0;
  });

  return {
    raw: metrics,
    scores: {
      activity: calculateActivityScore(metrics) || 0,
      impact: calculateImpactScore(metrics) || 0
    }
  };
};

export const calculateLeetCodeMetrics = (leetcode) => {
  if (!leetcode?.completeProfile) return null;

  const metrics = {
    problemSolving: {
      total: leetcode.completeProfile.solvedProblem || 0,
      easy: leetcode.completeProfile.easySolved || 0,
      medium: leetcode.completeProfile.mediumSolved || 0,
      hard: leetcode.completeProfile.hardSolved || 0,
    },
    consistency: {
      submissionRate: leetcode.completeProfile.submissionRate || 0,
      ranking: leetcode.basicProfile?.ranking || 0,
    }
  };

  return {
    raw: metrics,
    scores: {
      problems: Math.round((metrics.problemSolving.total / 100) * 100),
      consistency: Math.round(metrics.consistency.submissionRate),
      overall: Math.round(
        ((metrics.problemSolving.total / 100) * 70) + 
        (metrics.consistency.submissionRate * 0.3)
      )
    }
  };
};

export const updateStudentMetrics = async (userId, repos, leetcode) => {
  try {
    // Get existing metrics to update
    const existingMetrics = await StudentMetrics.findOne({ userId });
    
    // Calculate all metrics
    const githubMetrics = calculateGitHubMetrics(repos);
    const leetcodeMetrics = calculateLeetCodeMetrics(leetcode);
    
    // Calculate new daily and weekly activity
    const dailyActivity = calculateDailyActivity(repos, leetcode, existingMetrics);
    const weeklyMetrics = calculateWeeklyMetrics(dailyActivity);
    
    // Calculate consistency metrics
    const githubConsistency = calculateConsistencyMetrics(dailyActivity);
    
    // Calculate improvement metrics
    const improvement = calculateImprovementMetrics(weeklyMetrics);
    
    // Combine all metrics
    const metricsData = {
      userId,
      github: {
        repositories: {
          total: repos?.length || 0,
          active: repos?.filter(r => r.commits?.length > 0).length || 0,
          recentlyActive: githubMetrics.raw.recentActivity.repositories.size
        },
        commits: {
          total: repos?.reduce((sum, repo) => sum + (repo.commits?.length || 0), 0) || 0,
          recent90Days: githubMetrics.raw.recentActivity.commits
        },
        activity: {
          score: githubMetrics.scores.activity,
          activeDays: Array.from(githubMetrics.raw.recentActivity.activeDays)
        },
        impact: {
          score: githubMetrics.scores.impact,
          stars: githubMetrics.raw.impact.totalStars,
          forks: githubMetrics.raw.impact.totalForks
        },
        consistency: githubConsistency
      },
      leetcode: leetcodeMetrics ? {
        problemsSolved: {
          total: leetcodeMetrics.raw.problemSolving.total,
          easy: leetcodeMetrics.raw.problemSolving.easy,
          medium: leetcodeMetrics.raw.problemSolving.medium,
          hard: leetcodeMetrics.raw.problemSolving.hard
        },
        ranking: leetcodeMetrics.raw.consistency.ranking,
        consistency: {
          solvedLastWeek: weeklyMetrics.length > 0 ? weeklyMetrics[weeklyMetrics.length - 1].leetcodeProblems : 0,
          weeklyAverage: weeklyMetrics.length > 0 
            ? weeklyMetrics.reduce((sum, week) => sum + week.leetcodeProblems, 0) / weeklyMetrics.length 
            : 0
        }
      } : null,
      dailyActivity,
      weeklyMetrics,
      improvement,
      lastUpdated: new Date()
    };

    return StudentMetrics.findOneAndUpdate(
      { userId },
      metricsData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating student metrics:', error);
    throw error;
  }
};