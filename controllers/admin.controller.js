import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import bcrypt from 'bcryptjs';

export const bulkUploadStudentsJSON = async (req, res) => {
  try {
    const { students, classId } = req.body;
    
    if (!Array.isArray(students) || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format or missing class ID'
      });
    }

    // Hash passwords for all students
    const formattedStudents = await Promise.all(students.map(async student => ({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      rollNo: student.rollNo,
      githubID: student.githubID,
      leetCodeID: student.leetCodeID,
      password: await bcrypt.hash(student.password || 'defaultPassword123', 10),
      role: 'student',
      classId: [classId]
    })));

    // Insert students
    const createdStudents = await User.insertMany(formattedStudents);
    
    // Update class with new student IDs
    await Class.findByIdAndUpdate(
      classId,
      { $push: { students: { $each: createdStudents.map(s => s._id) } } }
    );

    res.json({
      success: true,
      message: `${createdStudents.length} students imported successfully`,
      students: createdStudents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing students',
      error: error.message
    });
  }
}; 