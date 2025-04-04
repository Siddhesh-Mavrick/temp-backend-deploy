# Student Progress Tracking API Documentation

This document provides details on the enhanced student progress tracking APIs that help teachers and administrators understand students' coding activities, habits, and improvements over time.

## API Endpoints

### 1. Get Student Metrics

Retrieve basic metrics for a student.

```
GET /api/v1/metrics/:userId
```

**Response**:
```json
{
  "success": true,
  "metrics": {
    "github": {
      "repositories": { "total": 12, "active": 8, "recentlyActive": 5 },
      "commits": { "total": 231, "recent90Days": 87 },
      "activity": { "score": 68, "activeDays": ["2023-04-12", "2023-04-15", ...] },
      "impact": { "score": 45, "stars": 12, "forks": 3 },
      "consistency": {
        "streak": { "current": 3, "longest": 14, "last30Days": 18 },
        "weeklyAverage": 3.5
      }
    },
    "leetcode": {
      "problemsSolved": { "total": 75, "easy": 45, "medium": 25, "hard": 5 },
      "ranking": 34567,
      "consistency": { "solvedLastWeek": 5, "weeklyAverage": 4.2 }
    },
    "dailyActivity": [...],
    "weeklyMetrics": [...],
    "improvement": {
      "lastMonth": {
        "commitIncrease": 12,
        "activeDaysIncrease": 3,
        "newRepos": 2,
        "leetcodeIncrease": 8
      }
    },
    "lastUpdated": "2023-04-20T15:32:45.678Z"
  }
}
```

### 2. Get Comprehensive Student Progress Report

Retrieve a comprehensive progress report for a student with trend analysis.

```
GET /api/v1/metrics/:userId/report?period=month
```

**Query Parameters**:
- `period` (optional): Filter metrics for a specific period. Options: `week`, `month`, `3months`, `6months`, `year`

**Response**:
```json
{
  "success": true,
  "report": {
    "student": {
      "id": "60d5e8b7a2b49a123b456789",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "githubUsername": "johndoe",
      "leetcodeUsername": "johncoder",
      "classId": "60d5e8b7a2b49a123b456abc"
    },
    "codingActivity": {
      "totalCommits": 231,
      "recentCommits": 87,
      "activeDaysLast30": 18,
      "currentStreak": 3,
      "longestStreak": 14,
      "weeklyAverage": 3.5
    },
    "repositories": {
      "total": 12,
      "active": 8,
      "recentlyActive": 5
    },
    "leetcode": {
      "totalSolved": 75,
      "easySolved": 45,
      "mediumSolved": 25,
      "hardSolved": 5,
      "weeklyAverage": 4.2
    },
    "improvement": {
      "lastMonth": {
        "commitIncrease": 12,
        "activeDaysIncrease": 3,
        "newRepos": 2,
        "leetcodeIncrease": 8
      }
    },
    "trends": {
      "commitTrend": "moderate increase",
      "activeDaysTrend": "slight increase",
      "overallTrend": "moderate increase"
    },
    "lastUpdated": "2023-04-20T15:32:45.678Z"
  }
}
```

### 3. Get Class Average Metrics

Retrieve average metrics for an entire class.

```
GET /api/v1/metrics/class/:classId/average
```

**Response**:
```json
{
  "success": true,
  "classSize": 25,
  "averageMetrics": {
    "github": {
      "commits": { "total": 175.3, "recent90Days": 52.1 },
      "repositories": { "total": 8.4, "active": 5.2 },
      "consistency": {
        "streak": { "current": 1.8, "longest": 7.3, "last30Days": 12.5 },
        "weeklyAverage": 2.8
      }
    },
    "leetcode": {
      "problemsSolved": { "total": 48.2, "easy": 30.5, "medium": 15.7, "hard": 2.0 }
    }
  }
}
```

### 4. Compare Student with Class Average

Compare a student's metrics with their class average to identify strengths and areas for improvement.

```
GET /api/v1/metrics/:userId/compare
```

**Response**:
```json
{
  "success": true,
  "comparison": {
    "github": {
      "commits": { "total": 31.8, "recent90Days": 66.9 },
      "repositories": { "total": 42.9, "active": 53.8 },
      "consistency": {
        "streak": { "current": 66.7, "longest": 91.8, "last30Days": 44.0 },
        "weeklyAverage": 25.0
      }
    },
    "leetcode": {
      "problemsSolved": { "total": 55.6, "easy": 47.5, "medium": 59.2, "hard": 150.0 }
    }
  },
  "studentMetrics": { ... },
  "classAverages": { ... }
}
```
*Note: Values represent percentage differences from the class average. Positive values indicate the student is performing above the class average.*

### 5. Update Student Metrics

Update a student's metrics with data from GitHub and LeetCode.

```
POST /api/v1/metrics/:userId/update
```

**Request Body**:
```json
{
  "repos": [...],  // GitHub repositories data
  "leetcode": {...}  // LeetCode profile data
}
```

**Response**:
```json
{
  "success": true,
  "message": "Metrics updated successfully",
  "metrics": { ... }
}
```

## Using the Student Progress APIs in Your Application

### For Teachers and Administrators

1. **Daily/Weekly Reviews**: 
   - Use the `/report` endpoint to get a quick overview of student progress
   - Filter by `period=week` to review recent activity

2. **Identifying Students Needing Help**:
   - Use the `/compare` endpoint to identify students significantly below class averages
   - Look for negative values in the comparison results

3. **Monitoring Class Progress**:
   - Track class averages over time using the `/class/:classId/average` endpoint
   - Compare different classes to identify effective teaching strategies

4. **Student Evaluations**:
   - Use the comprehensive reports as data for student evaluations
   - Look at trends and consistency rather than just total numbers

### For Students

1. **Self-Assessment**:
   - View personal coding habits and activity patterns
   - Compare performance with class averages
   - Track progress over time

2. **Goal Setting**:
   - Use the comparison data to set realistic improvement goals
   - Focus on improving consistency and specific areas of weakness

## Interpreting the Metrics

### Activity Metrics

- **Total Commits**: Overall coding activity across all repositories
- **Recent Commits**: Activity in the last 90 days (indicates current engagement)
- **Active Days**: Days with at least one commit (indicates consistency)
- **Streak**: Consecutive days with coding activity
  
### Consistency Metrics

- **Current Streak**: Current consecutive days of activity
- **Longest Streak**: Record for consecutive days of activity
- **Last30Days**: Days active in the last 30 days
- **Weekly Average**: Average days active per week

### Improvement Metrics

- **Commit Increase**: Change in commit count compared to previous period
- **Active Days Increase**: Change in active days compared to previous period
- **New Repos**: New repositories created in the current period
- **LeetCode Increase**: Change in LeetCode problems solved

### Trend Analysis

- **Commit Trend**: Direction and magnitude of change in commit frequency
- **Active Days Trend**: Direction and magnitude of change in active days
- **Overall Trend**: Combined assessment of activity patterns

## Best Practices

1. **Regular Updates**: 
   - Schedule regular metric updates for accurate reporting
   - Recommend daily or weekly updates depending on class size

2. **Period-Based Analysis**:
   - Use different periods for different analysis needs
   - Short periods (week/month) for immediate feedback
   - Longer periods (3months/6months) for trend analysis

3. **Balanced Assessment**:
   - Don't rely solely on quantity metrics
   - Consider consistency, improvement, and trends
   - Use comparisons with context (class size, subject area, etc.) 