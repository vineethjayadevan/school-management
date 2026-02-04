const Staff = require('../models/Staff');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
const getStaff = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { role: { $regex: req.query.search, $options: 'i' } },
                    { subjects: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        const staff = await Staff.find({ ...keyword }).sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new staff
// @route   POST /api/staff
// @access  Private
const addStaff = async (req, res) => {
    try {
        const { email } = req.body;
        const staffExists = await Staff.findOne({ email });

        if (staffExists) {
            return res.status(400).json({ message: 'Staff with this email already exists' });
        }

        const startId = 'EMP' + Date.now().toString().slice(-4);

        // Explicitly mapping fields if needed, or assuming body matches schema
        // Frontend sends: name, role, contact, email, subject, qualification
        // Backend expects: employeeId, name, role, qualification, email, phone, joiningDate, subjects specific array

        // We can handle some defaults here if not provided
        const newStaff = await Staff.create({
            employeeId: req.body.employeeId || startId,
            name: req.body.name,
            role: req.body.role,
            email: req.body.email,
            phone: req.body.phone || req.body.contact, // Handle both
            qualification: req.body.qualification,
            joiningDate: req.body.joiningDate || new Date(),
            subjects: req.body.subjects ? (Array.isArray(req.body.subjects) ? req.body.subjects : [req.body.subjects]) : [],
            salary: req.body.salary || 0,
        });

        res.status(201).json(newStaff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private
const updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        // Update fields
        staff.name = req.body.name || staff.name;
        staff.role = req.body.role || staff.role;
        staff.email = req.body.email || staff.email;
        staff.phone = req.body.phone || req.body.contact || staff.phone;
        staff.qualification = req.body.qualification || staff.qualification;
        staff.joiningDate = req.body.joiningDate || staff.joiningDate;
        staff.category = req.body.category || staff.category;
        staff.salary = req.body.salary !== undefined ? req.body.salary : staff.salary;
        staff.paymentMode = req.body.paymentMode || staff.paymentMode;
        staff.status = req.body.status || staff.status;

        // Handle subjects update
        if (req.body.subjects) {
            staff.subjects = Array.isArray(req.body.subjects) ? req.body.subjects : [req.body.subjects];
        }

        const updatedStaff = await staff.save();
        res.json(updatedStaff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private
const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        await staff.deleteOne();
        res.json({ message: 'Staff removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStaff,
    addStaff,
    updateStaff,
    deleteStaff
};
