const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: {
        type: String,
        enum: ['ShortAnswer', 'LongAnswer', 'MCQ', 'TrueFalse'],
        default: 'ShortAnswer'
    },
    marks: { type: Number, required: true },
    options: [{ type: String }], // Used only for MCQ
    correctAnswer: { type: String } // Optional: For auto-grading later
});

const sectionSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Section A - Objective"
    instructions: { type: String },
    questions: [questionSchema]
});

const questionPaperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }, // Which class this is for
    className: { type: String }, // Denormalized for rapid display
    section: { type: String }, // Section e.g., 'A', 'B'. Optional if applied to all sections
    subject: { type: String, required: true },
    examType: { type: String, required: true }, // From ExamCategory
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }, // The creator
    academicYear: { type: String, required: true },
    examDate: { type: Date },
    totalMarks: { type: Number, required: true, default: 0 },
    duration: { type: String }, // e.g., "2 Hours"
    instructions: { type: String }, // General instructions for the whole paper
    sections: [sectionSchema],
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' } // Published means visible to Class Teacher/Admin
}, {
    timestamps: true
});

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
module.exports = QuestionPaper;
