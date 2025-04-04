const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'teacher' },
  classId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  githubUsername: { type: String, required: true },
});

module.exports = mongoose.model('Teacher', teacherSchema);