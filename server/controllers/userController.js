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

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

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
