import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'teacher', 'student']
  },
  classId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  rollNo: {
    type: String,
    required: function() { return this.role === 'student'; },
    sparse: true
  },
  githubID: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  leetCodeID: {
    type: String
  },
  githubUsername: {
    type: String,
    required: function() { return this.role === 'teacher'; }
  },

  githubData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GithubData'
  },
  leetcodeData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeetcodeData'
  },
  githubRepos: [{
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
    forks_count: Number
  }],
  notifications: [{
    message: String,
    createdAt: { type: Date, default: Date.now },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read: { type: Boolean, default: false }
  }],
  resetPasswordToken: String,
  resetPasswordExpiry: Date
}, { timestamps: true });

userSchema.index({ rollNo: 1, classId: 1 }, {
  unique: true,
  partialFilterExpression: { role: 'student' }
});

export const User = mongoose.model('User', userSchema);
