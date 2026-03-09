const QuestionPaper = require('../models/QuestionPaper');
const Class = require('../models/Class');
const Staff = require('../models/Staff');

// @desc    Create a new question paper
// @route   POST /api/question-papers
// @access  Private (Teacher)
const createQuestionPaper = async (req, res) => {
    try {
        const {
            title, classId, subject, examType, academicYear, examDate,
            duration, instructions, sections, status
        } = req.body;

        // Verify the user is a teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can create question papers' });
        }

        // Get class details for denormalization
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        let totalMarks = 0;
        if (sections && Array.isArray(sections)) {
            sections.forEach(sec => {
                if (sec.questions && Array.isArray(sec.questions)) {
                    sec.questions.forEach(q => {
                        totalMarks += Number(q.marks) || 0;
                    });
                }
            });
        }

        const questionPaper = await QuestionPaper.create({
            title,
            classId,
            className: classDoc.name,
            subject,
            examType,
            teacher: req.user.profileId, // From auth middleware
            academicYear,
            examDate: examDate || null,
            totalMarks,
            duration,
            instructions,
            sections,
            status: status || 'Draft'
        });

        res.status(201).json(questionPaper);
    } catch (error) {
        console.error('Create Question Paper Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all question papers based on role
// @route   GET /api/question-papers
// @access  Private (Teacher/Class Teacher/Admin)
const getQuestionPapers = async (req, res) => {
    try {
        const { academicYear } = req.query;
        let query = {};

        if (academicYear) {
            query.academicYear = academicYear;
        }

        const role = req.user.role;

        if (role === 'teacher') {
            const staffId = req.user.profileId;

            // Check if they are a class teacher for any class
            const classesWhereTeacher = await Class.find({ "sections.classTeacher": staffId });
            const classIds = classesWhereTeacher.map(c => c._id);

            if (classIds.length > 0) {
                // If they are a class teacher, they can see papers they created OR published papers for their classes
                query.$or = [
                    { teacher: staffId },
                    { classId: { $in: classIds }, status: 'Published' }
                ];
            } else {
                // Regular teacher sees only their own papers
                query.teacher = staffId;
            }
        } else if (['admin', 'superadmin', 'superuser'].includes(role)) {
            // Admins see everything based on query params
        } else {
            return res.status(403).json({ message: 'Unauthorized view' });
        }

        const questionPapers = await QuestionPaper.find(query)
            .populate('teacher', 'name')
            .sort({ createdAt: -1 });

        res.json(questionPapers);
    } catch (error) {
        console.error('Get Question Papers Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single question paper by ID
// @route   GET /api/question-papers/:id
// @access  Private
const getQuestionPaperById = async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id)
            .populate('teacher', 'name')
            .populate('classId', 'name');

        if (!questionPaper) {
            return res.status(404).json({ message: 'Question paper not found' });
        }

        // Security check: Teacher must own it, or be class teacher for the class (if published), or be an admin
        const role = req.user.role;
        const profileId = req.user.profileId;

        if (role === 'teacher') {
            const isOwner = questionPaper.teacher._id.toString() === profileId.toString();

            // Check if teacher is class teacher for this question paper's class
            const classDoc = await Class.findOne({
                _id: questionPaper.classId._id,
                "sections.classTeacher": profileId
            });
            const isClassTeacherForThisClass = !!classDoc;

            if (!isOwner) {
                if (!isClassTeacherForThisClass || questionPaper.status !== 'Published') {
                    return res.status(403).json({ message: 'Unauthorized access to this question paper' });
                }
            }
        } else if (!['admin', 'superadmin', 'superuser'].includes(role)) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        res.json(questionPaper);
    } catch (error) {
        console.error('Get Question Paper By ID Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a question paper
// @route   PUT /api/question-papers/:id
// @access  Private (Teacher who created it)
const updateQuestionPaper = async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id);

        if (!questionPaper) {
            return res.status(404).json({ message: 'Question paper not found' });
        }

        // Only the creator can update
        if (req.user.role === 'teacher' && questionPaper.teacher.toString() !== req.user.profileId.toString()) {
            return res.status(403).json({ message: 'You can only edit question papers you created' });
        }

        // Recalculate total marks if sections are provided
        if (req.body.sections) {
            let totalMarks = 0;
            req.body.sections.forEach(sec => {
                if (sec.questions) {
                    sec.questions.forEach(q => {
                        totalMarks += Number(q.marks) || 0;
                    });
                }
            });
            req.body.totalMarks = totalMarks;
        }

        if (req.body.examDate === '' || !req.body.examDate) {
            req.body.examDate = null;
        }

        const updatedQP = await QuestionPaper.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('teacher', 'name');

        res.json(updatedQP);
    } catch (error) {
        console.error('Update Question Paper Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a question paper
// @route   DELETE /api/question-papers/:id
// @access  Private (Teacher who created it or Admin)
const deleteQuestionPaper = async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.id);

        if (!questionPaper) {
            return res.status(404).json({ message: 'Question paper not found' });
        }

        // Check ownership
        if (req.user.role === 'teacher' && questionPaper.teacher.toString() !== req.user.profileId.toString()) {
            return res.status(403).json({ message: 'You can only delete question papers you created' });
        }

        await questionPaper.deleteOne();
        res.json({ message: 'Question paper removed' });
    } catch (error) {
        console.error('Delete Question Paper Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createQuestionPaper,
    getQuestionPapers,
    getQuestionPaperById,
    updateQuestionPaper,
    deleteQuestionPaper
};
