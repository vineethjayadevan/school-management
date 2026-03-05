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
                    // { subjects: { $regex: req.query.search, $options: 'i' } }, // Can't regex ObjectId easily
                ],
            }
            : {};

        const staff = await Staff.find({ ...keyword })
            .populate('subjects', 'name code') // Populate subject details
            .sort({ createdAt: -1 });
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
        if (email) {
            const staffExists = await Staff.findOne({ email });
            if (staffExists) {
                return res.status(400).json({ message: 'Staff with this email already exists' });
            }
        }

        const startId = 'EMP' + Date.now().toString().slice(-4);

        const newStaff = await Staff.create({
            employeeId: req.body.employeeId || startId,
            name: req.body.name,
            role: req.body.role,
            email: req.body.email || undefined,
            phone: req.body.phone || req.body.contact,
            qualification: req.body.qualification,
            joiningDate: req.body.joiningDate || new Date(),
            // Ensure subjects is array of IDs
            subjects: req.body.subjects ? (Array.isArray(req.body.subjects) ? req.body.subjects : [req.body.subjects]) : [],
            salary: req.body.salary || 0,
            category: req.body.category,
            subcategory: req.body.subcategory,
            isMarried: req.body.isMarried || false,
            spouseName: req.body.spouseName,
            spousePhone: req.body.spousePhone,
            spouseEmail: req.body.spouseEmail,
            address: req.body.address,
            idCardNumber: req.body.idCardNumber,
            idCardImage: req.body.idCardImage,
            photoUrl: req.body.photoUrl || ''
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

        // Handle email update and duplicates
        if (req.body.email !== undefined && req.body.email !== staff.email) {
            if (req.body.email) {
                const emailExists = await Staff.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Staff with this email already exists' });
                }
                staff.email = req.body.email;
            } else {
                staff.email = undefined;
            }
        }
        staff.phone = req.body.phone || req.body.contact || staff.phone;
        staff.qualification = req.body.qualification || staff.qualification;
        staff.joiningDate = req.body.joiningDate || staff.joiningDate;
        staff.category = req.body.category || staff.category;
        staff.subcategory = req.body.subcategory !== undefined ? req.body.subcategory : staff.subcategory;
        staff.salary = req.body.salary !== undefined ? req.body.salary : staff.salary;
        staff.paymentMode = req.body.paymentMode || staff.paymentMode;
        staff.status = req.body.status || staff.status;
        staff.isMarried = req.body.isMarried !== undefined ? req.body.isMarried : staff.isMarried;
        staff.spouseName = req.body.spouseName !== undefined ? req.body.spouseName : staff.spouseName;
        staff.spousePhone = req.body.spousePhone !== undefined ? req.body.spousePhone : staff.spousePhone;
        staff.spouseEmail = req.body.spouseEmail !== undefined ? req.body.spouseEmail : staff.spouseEmail;
        staff.address = req.body.address !== undefined ? req.body.address : staff.address;
        staff.idCardNumber = req.body.idCardNumber !== undefined ? req.body.idCardNumber : staff.idCardNumber;
        staff.idCardImage = req.body.idCardImage !== undefined ? req.body.idCardImage : staff.idCardImage;
        staff.photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : staff.photoUrl;

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

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access  Private
const getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id).populate('subjects', 'name code');
        if (staff) {
            res.json(staff);
        } else {
            res.status(404).json({ message: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStaff,
    getStaffById,
    addStaff,
    updateStaff,
    deleteStaff
};
