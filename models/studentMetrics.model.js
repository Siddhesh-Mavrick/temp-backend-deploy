import mongoose from 'mongoose';

// Schema for daily activity tracking
const dailyActivitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  commitCount: {
    type: Number,
    default: 0
  },
  repositoriesWorkedOn: {
    type: [String],
    default: []
  },
  leetcodeProblems: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schema for weekly metrics
const weeklyMetricsSchema = new mongoose.Schema({
  weekOf: {
    type: Date,
    required: true
  },
  commitCount: {
    type: Number,
    default: 0
  },
  activeDays: {
    type: Number,
    default: 0
  },
  repositoriesWorkedOn: {
    type: [String],
    default: []
  },
  leetcodeProblems: {
    type: Number,
    default: 0
  }
}, { _id: false });

const studentMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  github: {
    repositories: {
      total: Number,
      active: Number,
      recentlyActive: Number
    },
    commits: {
      total: Number,
      recent90Days: Number
    },
    activity: {
      score: Number,
      activeDays: [String]
    },
    impact: {
      score: Number,
      stars: Number,
      forks: Number
    },
    // Added for consistency tracking
    consistency: {
      streak: {
        current: {
          type: Number,
          default: 0
        },
        longest: {
          type: Number,
          default: 0
        },
        last30Days: {
          type: Number,
          default: 0
        }
      },
      weeklyAverage: {
        type: Number,
        default: 0
      }
    }
  },
  leetcode: {
    problemsSolved: {
      total: Number,
      easy: Number,
      medium: Number,
      hard: Number
    },
    ranking: Number,
    // Added for consistency tracking
    consistency: {
      solvedLastWeek: {
        type: Number,
        default: 0
      },
      weeklyAverage: {
        type: Number,
        default: 0
      }
    }
  },
  // Daily activity tracking
  dailyActivity: {
    type: [dailyActivitySchema],
    default: []
  },
  // Weekly metrics for trends
  weeklyMetrics: {
    type: [weeklyMetricsSchema],
    default: []
  },
  // Improvement metrics
  improvement: {
    lastMonth: {
      commitIncrease: {
        type: Number,
        default: 0
      },
      activeDaysIncrease: {
        type: Number,
        default: 0
      },
      newRepos: {
        type: Number,
        default: 0
      },
      leetcodeIncrease: {
        type: Number,
        default: 0
      }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

studentMetricsSchema.index({ userId: 1 });
export const StudentMetrics = mongoose.model('StudentMetrics', studentMetricsSchema);