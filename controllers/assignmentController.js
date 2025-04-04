import { Assignment } from '../models/Assignment.model.js';
import { Class } from '../models/class.model.js';
import { User } from '../models/user.model.js';
import GitHubService from '../utils/githubService.js';
import dotenv from 'dotenv';

dotenv.config();

export const createAssignment = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { title, description, dueDate, points, repoUrl, classId } = req.body;
    const teacherId = req.user?.userId;
    
    console.log('Teacher ID:', teacherId);

    // Get all students in the class
    const classData = await Class.findById(classId).populate({
      path: 'students',
      model: 'User'
    });
    
    // Create assignment
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      points,
      classId,
      teacherId,
      repoUrl,
      studentRepos: []
    });

    // Add entry for each student
    for (const student of classData.students) {
      assignment.studentRepos.push({
        studentId: student._id,
        submitted: false
      });
    }

    await assignment.save();

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getClassAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log('Fetching assignments for class:', classId);
    
    const assignments = await Assignment.find({ classId })
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log('Found assignments:', assignments.length);
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error in getClassAssignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'firstName lastName')
      .populate('studentRepos.studentId', 'firstName lastName rollNo githubID');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // First, get the student to find their class
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get the student's class ID
    const classId = student.classId;
    if (!classId) {
      return res.json({
        success: true,
        assignments: []
      });
    }
    
    // Find all assignments for the student's class
    const assignments = await Assignment.find({
      classId: classId
    })
    .populate('classId', 'name')
    .populate('teacherId', 'firstName lastName')
    .populate('studentRepos.studentId', 'firstName lastName rollNo')
    .sort({ dueDate: 1 });
    
    // Process assignments to add student repo info if it doesn't exist
    const processedAssignments = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      
      // Check if student already has a repo entry
      const existingRepo = assignmentObj.studentRepos?.find(
        repo => repo.studentId._id.toString() === studentId
      );
      
      // If not, add a placeholder entry
      if (!existingRepo) {
        if (!assignmentObj.studentRepos) {
          assignmentObj.studentRepos = [];
        }
        
        assignmentObj.studentRepos.push({
          studentId: {
            _id: studentId,
            firstName: student.firstName,
            lastName: student.lastName,
            rollNo: student.rollNo
          },
          submitted: false,
          repoUrl: '',
          submissionDate: null
        });
      }
      
      return assignmentObj;
    });
    
    res.json({
      success: true,
      assignments: processedAssignments
    });
  } catch (error) {
    console.error('Error in getStudentAssignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, solutionUrl } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Find the student's repo in the assignment
    const studentRepoIndex = assignment.studentRepos.findIndex(
      repo => repo.studentId.toString() === studentId
    );
    
    if (studentRepoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Student repository not found for this assignment'
      });
    }
    
    // Update the submission status
    assignment.studentRepos[studentRepoIndex].submitted = true;
    assignment.studentRepos[studentRepoIndex].submissionDate = new Date();
    
    // Add solution URL if provided
    if (solutionUrl) {
      assignment.studentRepos[studentRepoIndex].repoUrl = solutionUrl;
    }
    
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment marked as submitted'
    });
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('classId', 'name')
      .populate('teacherId', 'firstName lastName')
      .populate('studentRepos.studentId', 'firstName lastName rollNo')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};