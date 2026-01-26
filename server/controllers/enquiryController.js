const Enquiry = require('../models/Enquiry');

// @desc    Create a new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = async (req, res) => {
    try {
        const {
            studentFirstName, studentMiddleName, studentLastName,
            fatherName, motherName,
            contactNumber, email,
            dob, studentGrade,
            conveyance, address, classMode,
            message
        } = req.body;

        const enquiry = await Enquiry.create({
            studentFirstName,
            studentMiddleName,
            studentLastName,
            fatherName,
            motherName,
            contactNumber,
            email,
            dob,
            studentGrade,
            conveyance,
            address,
            classMode,
            message
        });

        res.status(201).json(enquiry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin/Office)
const getEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Private (Admin/Office)
const updateEnquiryStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const enquiry = await Enquiry.findById(req.params.id);

        if (enquiry) {
            enquiry.status = status || enquiry.status;
            enquiry.notes = notes || enquiry.notes;

            const updatedEnquiry = await enquiry.save();
            res.json(updatedEnquiry);
        } else {
            res.status(404).json({ message: 'Enquiry not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus
};
