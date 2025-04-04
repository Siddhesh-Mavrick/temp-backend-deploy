import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    yearOfStudy: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true,
        enum: ["CS", "AIDS", "IT"]
    },
    division: {
        type: String,
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
    }],
    feedback: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }]
}, { timestamps: true });

classSchema.index({ className: 1, yearOfStudy: 1, branch: 1, division: 1 }, { unique: true });
export const Class = mongoose.model('Class', classSchema);