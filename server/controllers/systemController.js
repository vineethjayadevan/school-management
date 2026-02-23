const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

// @desc    Super Admin Login
// @route   POST /api/system/login
// @access  Public (Requires PIN)
const loginSuperAdmin = async (req, res) => {
    const { username, password, pin } = req.body;

    try {
        // Validate PIN
        if (!process.env.SECRET_PIN) {
            console.error('SECRET_PIN is not set in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        if (pin !== process.env.SECRET_PIN) {
            return res.status(401).json({ message: 'Invalid credentials or PIN' });
        }

        const user = await User.findOne({ username });

        if (user && user.role === 'superadmin' && (await user.matchPassword(password))) {
            const token = generateToken(user._id);

            // Set cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site in prod
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                avatar: user.avatar,
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials or PIN' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/system/users
// @access  Private/SuperAdmin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').populate('createdBy', 'name username');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/system/users
// @access  Private/SuperAdmin
const createUser = async (req, res) => {
    const { name, username, password, role, email } = req.body;

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Optional email check if provided
        if (email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        const user = await User.create({
            name,
            username,
            email: email || undefined,
            password,
            role,
            createdBy: req.user._id,
            isActive: true
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset a user's password
// @route   PUT /api/system/users/:id/reset-password
// @access  Private/SuperAdmin
const resetUserPassword = async (req, res) => {
    const { newPassword } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save(); // Password hashing is handled by pre-save hook

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginSuperAdmin,
    getUsers,
    createUser,
    resetUserPassword
};
