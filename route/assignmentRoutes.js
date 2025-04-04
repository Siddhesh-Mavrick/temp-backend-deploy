import express from 'express';
import authMiddelware from '../middelwares/auth.js';

import { 
  createAssignment, 
  getClassAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  submitAssignment,
  getAllAssignments
} from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/create', authMiddelware, createAssignment);
router.get('/assignment/:id', authMiddelware, getAssignment);
router.get('/:classId', authMiddelware, getClassAssignments);
router.put('/:id', authMiddelware, updateAssignment);
router.delete('/:id', authMiddelware, deleteAssignment);
router.get('/student/:studentId', authMiddelware, getStudentAssignments);
router.post('/submit', authMiddelware, submitAssignment);
router.get('/all', authMiddelware,  getAllAssignments);

export default router;