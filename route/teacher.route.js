import express from 'express';
import { createTeacher, addTeacherFeedback, getTeacherStats } from '../controllers/teacher.controller.js';
import authMiddelware from '../middelwares/auth.js';

const router = express.Router();

router.post('/create', authMiddelware, createTeacher);
router.post('/feedback', authMiddelware, addTeacherFeedback);
router.get('/:teacherId/stats', authMiddelware, getTeacherStats);

export default router;