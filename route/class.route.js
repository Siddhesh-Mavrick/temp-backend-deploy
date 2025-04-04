import express from 'express';
import { 
    createClass,  
    getClassById, 
    updateClass, 
    deleteClass,
    getStudentByClass,
    getAllClasses,
    downloadClassData,
    downloadClassDataWithProgress,
    downloadClassDataWithPrecomputedProgress,
    getTeacherClasses
} from '../controllers/class.controller.js';
import authMiddleware from '../middelwares/auth.js';
import { User } from '../models/user.model.js';
const router = express.Router();

// Class CRUD routes
router.post('/create', authMiddleware, createClass);
router.get('/classes', getAllClasses);
router.get('/:classId', getClassById);
router.put('/:classId', authMiddleware, updateClass);
router.delete('/:classId', authMiddleware, deleteClass);

// Excel export routes
router.get('/:classId/excel', downloadClassData);
router.post('/:classId/excel-with-progress', downloadClassDataWithProgress);
router.get('/:classId/excel-with-progress', downloadClassDataWithPrecomputedProgress);

// Student-related routes
router.get('/classes/:classId/students', getStudentByClass);

router.get('/teacher/:teacherId/classes', getTeacherClasses);

export default router;