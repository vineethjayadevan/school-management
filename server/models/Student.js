const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    admissionNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rollNo: { type: String },
    className: { type: String, required: true },
    section: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
    bloodGroup: { type: String },
    dob: { type: Date },

    // Parents Info
    // Parents Info
    guardian: { type: String, required: true }, // Main contact person (mapped to Father or Mother name)

    // Guardian Details (If not living with parents)
    isGuardian: { type: Boolean, default: false },
    guardianName: { type: String },
    guardianRelation: { type: String },
    guardianOccupation: { type: String },
    guardianPhone: { type: String },
    guardianAddress: { type: String },

    // Sibling Information
    siblings: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        name: { type: String },
        class: { type: String },
        section: { type: String },
        admissionNo: { type: String }
    }],

    // Transportation Details
    transportation: {
        mode: { type: String, enum: ['School Bus', 'Private', 'Walking'], default: 'Walking' },
        routeNumber: { type: String },
        pickupPoint: { type: String },
        dropPoint: { type: String }
    },

    // Emergency Contact
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
    },

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

    address: { type: String }, // Legacy field, kept for backward compatibility

    // New Address Structure
    residentialAddress: {
        houseNo: { type: String },
        street: { type: String },
        locality: { type: String },
        city: { type: String },
        state: { type: String },
        pinCode: { type: String },
        country: { type: String, default: 'India' }
    },
    permanentAddress: {
        houseNo: { type: String },
        street: { type: String },
        locality: { type: String },
        city: { type: String },
        state: { type: String },
        pinCode: { type: String },
        country: { type: String, default: 'India' }
    },

    // New Admission Fields
    applicationNo: { type: String, required: true },
    submissionDate: { type: Date, required: true },
    placeOfBirth: { type: String },
    nationality: { type: String },
    religion: { type: String },
    caste: { type: String },
    category: { type: String, enum: ['General', 'SC', 'ST', 'OBC', 'Others', ''] },
    aadharNo: { type: String },

    // Previous Schooling
    previousSchool: { type: String },
    previousClass: { type: String },  // No enum — empty string (no previous school) must be accepted
    mediumOfInstruction: { type: String },

    // Conveyance
    conveyanceSlab: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 = Not Applicable
    lastConveyancePayment: { type: Date }, // Track last payment date for status

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
        type: { type: String }, // MIME type
        category: { type: String } // 'Birth Certificate', 'Transfer Certificate', 'Previous Marksheet', 'Aadhar Card', 'Others'
    }],

    // Academic & Promotion Tracking
    currentAcademicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    promotionStatus: {
        type: String,
        enum: ['Active', 'Promoted', 'Detained', 'Graduated', 'On Hold', 'Relieved'],
        default: 'Active'
    },

    // Transfer Certificate Details
    tcDetails: {
        tcNo: { type: String },
        applicationDate: { type: Date },
        issueDate: { type: Date },
        lastDateAttended: { type: Date },
        reasonForLeaving: { type: String },
        conduct: { type: String, default: 'Good' },
        isTCPromoted: { type: Boolean },
        remarks: { type: String },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    financialClearance: {
        type: Boolean,
        default: true
    },
    academicHistory: [{
        academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
        className: { type: String },
        section: { type: String },
        promotionStatus: { type: String },
        remarks: { type: String },
        recordedAt: { type: Date, default: Date.now }
    }],

    // Per-category fee discounts
    discounts: [{
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeCategory' },
        categoryName: { type: String },      // denormalised for fast display
        discountAmount: { type: Number, min: 0, default: 0 }
    }],

    // Status
    feesStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partially Paid'], default: 'Pending' },
    isActive: { type: Boolean, default: true },

}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
