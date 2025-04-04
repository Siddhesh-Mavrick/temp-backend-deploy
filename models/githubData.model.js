import mongoose from 'mongoose';

const githubDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  githubId: { type: String, required: true },
  summary: {
    totalRepos: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    activeRepos: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 }
  },
  repos: [{
    id: Number,
    name: String,
    full_name: String,
    description: String,
    html_url: String,
    created_at: Date,
    updated_at: Date,
    pushed_at: Date,
    language: String,
    stargazers_count: Number,
    forks_count: Number,
    commits: [{
      message: String,
      date: Date,
      url: String,
      author: String,
      sha: String
    }]
  }],
  lastUpdated: { type: Date, default: Date.now }
});

export const GithubData = mongoose.model('GithubData', githubDataSchema);