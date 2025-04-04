import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  points: { type: Number, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoUrl: { type: String, required: true },
  studentRepos: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submitted: { type: Boolean, default: false },
    submissionDate: Date
  }],
}, { timestamps: true });

export const Assignment = mongoose.model('Assignment', assignmentSchema);