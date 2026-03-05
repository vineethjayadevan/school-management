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
            if (req.body.profileId) {
                // Explicit link from frontend selector
                userData.profileId = req.body.profileId;
            } else {
                const Student = require('../models/Student');
                const normalize = (val) => val ? val.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';

                let student = null;
                if (email) {
                    student = await Student.findOne({ email: email.toLowerCase() });
                }
                if (!student) {
                    const normalizedSearchName = normalize(name);
                    const allStudents = await Student.find({});
                    student = allStudents.find(s => normalize(s.name) === normalizedSearchName);
                }
                if (student) {
                    userData.profileId = student._id;
                    console.log(`Auto Link: User ${email} -> Student ${student.name}`);
                }
            }
        }

        // Automatic Profile Linking for Teachers
        if (role === 'teacher') {
            if (req.body.profileId) {
                // Explicit link from frontend selector
                userData.profileId = req.body.profileId;
            } else {
                const Staff = require('../models/Staff');
                const normalize = (val) => val ? val.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';

                let staff = null;
                if (email) {
                    staff = await Staff.findOne({ email: email.toLowerCase() });
                }
                if (!staff) {
                    const normalizedSearchName = normalize(name);
                    const allStaff = await Staff.find({});
                    staff = allStaff.find(s => normalize(s.name) === normalizedSearchName);
                }
                if (staff) {
                    userData.profileId = staff._id;
                    console.log(`Auto Link: User ${email} -> Staff ${staff.name}`);
                }
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

// @desc    Update a user (Superuser only)
// @route   PATCH /api/users/:id
// @access  Private/Superuser
const updateUser = async (req, res) => {
    try {
        const { name, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (role) user.role = role;

        // If role changed to student or teacher, we might want to re-evaluate profileId
        // but for now let's just update the basics.

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unlinked Staff or Student profiles (for user creation dropdown)
// @route   GET /api/users/unlinked-profiles?type=staff|student
// @access  Private/Superuser
const getUnlinkedProfiles = async (req, res) => {
    try {
        const { type } = req.query;

        // Find all profileIds already linked to a user account
        const linkedUsers = await User.find({ profileId: { $exists: true, $ne: null } }).select('profileId');
        const linkedIds = linkedUsers.map(u => u.profileId.toString());

        if (type === 'staff') {
            const Staff = require('../models/Staff');
            const profiles = await Staff.find({
                _id: { $nin: linkedIds }
            }).select('_id name email role category subcategory').sort({ name: 1 });
            return res.json(profiles);
        }

        if (type === 'student') {
            const Student = require('../models/Student');
            const profiles = await Student.find({
                _id: { $nin: linkedIds },
                isActive: true
            }).select('_id name email admissionNo className section').sort({ name: 1 });
            return res.json(profiles);
        }

        res.status(400).json({ message: 'type must be "staff" or "student"' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUsersList,
    getUnlinkedProfiles,
    updateUser
};
