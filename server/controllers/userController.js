const User = require('../models/User');

// @desc    Create a new user (Superuser only)
// @route   POST /api/users
// @access  Private/Superuser
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userData = {
            name,
            email,
            password,
            role,
        };

        // Automatic Profile Linking for Students
        if (role === 'student') {
            const Student = require('../models/Student');
            const normalize = (val) => val ? val.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';

            let student = null;
            // 1. Try Email Match
            if (email) {
                student = await Student.findOne({ email: email.toLowerCase() });
            }

            // 2. Try Normalized Name Match
            if (!student) {
                const normalizedSearchName = normalize(name);
                const allStudents = await Student.find({});
                student = allStudents.find(s => normalize(s.name) === normalizedSearchName);
            }

            if (student) {
                userData.profileId = student._id;
                console.log(`Automatic Link (User API): User ${email} -> Student ${student.name} (${student.admissionNo})`);
            }
        }

        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Superuser
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (ID and Name only) for dropdowns
// @route   GET /api/users/list
// @access  Private (Admin, Board)
const getUsersList = async (req, res) => {
    try {
        // Only return users who can record settlements (Staff/Admins)
        // Exclude 'student' and 'teacher' (unless teachers handle money, usually office staff/admins do)
        const allowedRoles = ['board_member'];

        const users = await User.find({
            role: { $in: allowedRoles }
        }).select('_id name role');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUsersList
};
