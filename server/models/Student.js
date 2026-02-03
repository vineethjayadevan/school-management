const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    admissionNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rollNo: { type: String },
    className: { type: String, required: true },
    section: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    dob: { type: Date },

    // Parents Info
    // Parents Info
    guardian: { type: String, required: true }, // Main contact person (mapped to Father or Mother name)

    // Father's Details
    fatherName: { type: String },
    fatherOccupation: { type: String },
    fatherDesignation: { type: String },
    fatherCompany: { type: String },
    fatherOfficeAddress: { type: String },
    fatherEducation: { type: String },
    fatherIncome: { type: String },
    fatherAadhar: { type: String },
    fatherMobile: { type: String }, // New
    fatherEmail: { type: String },  // New

    // Mother's Details
    motherName: { type: String },
    motherOccupation: { type: String },
    motherDesignation: { type: String },
    motherCompany: { type: String },
    motherOfficeAddress: { type: String },
    motherEducation: { type: String },
    motherIncome: { type: String },
    motherAadhar: { type: String },
    motherMobile: { type: String }, // New
    motherEmail: { type: String },  // New
    primaryPhone: { type: String, required: true }, // Kept for backward compatibility/searching, mapped from fatherMobile
    email: { type: String },

    address: { type: String },

    // New Admission Fields
    applicationNo: { type: String, required: true },
    submissionDate: { type: Date, required: true },
    placeOfBirth: { type: String },
    nationality: { type: String },
    religion: { type: String },
    caste: { type: String },
    category: { type: String, enum: ['General', 'SC', 'ST', 'OBC', 'Others'] },
    aadharNo: { type: String },

    // Previous Schooling
    previousSchool: { type: String },
    previousClass: { type: String, enum: ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
    mediumOfInstruction: { type: String },

    // Health & Special Needs
    hasLearningDisability: { type: Boolean, default: false },
    learningDisabilityDetails: { type: String },
    hasMedicalCondition: { type: Boolean, default: false },
    medicalConditionDetails: { type: String },
    hasAllergy: { type: Boolean, default: false },
    allergyDetails: { type: String },

    // Media
    photoUrl: { type: String, default: '' }, // Path to uploaded image
    documents: [{
        name: { type: String },
        url: { type: String },
        type: { type: String } // e.g., 'pdf', 'jpg'
    }],

    // Status
    feesStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partially Paid'], default: 'Pending' },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
