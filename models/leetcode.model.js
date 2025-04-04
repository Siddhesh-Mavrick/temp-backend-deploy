import mongoose from 'mongoose';

const leetcodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  basicProfile: {
    username: String,
    name: String,
    totalSolved: Number,
    ranking: Number,
    contributionPoints: Number,
    reputation: Number
  },
  completeProfile: {
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number,
    acceptanceRate: Number,
    totalQuestions: Number,
    totalSolved: Number,
    solvedProblem: Number
  },
  contests: {
    attendedContestsCount: Number,
    rating: Number,
    globalRanking: Number,
    totalParticipants: Number,
    topPercentage: Number
  },
  badges: [{
    name: String,
    icon: String,
    displayName: String,
    category: String
  }],
  calender: {
    type: Map,
    of: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

leetcodeSchema.index({ userId: 1 });

export const LeetCode = mongoose.model('LeetCode', leetcodeSchema);