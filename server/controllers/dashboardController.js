const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const studentCount = await Student.countDocuments();
        const staffCount = await Staff.countDocuments();

        // Calculate total revenue
        const revenueAggregation = await Fee.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        // Get recent 5 fee transactions for activity feed
        const recentFees = await Fee.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name');

        // Get recent 5 admissions
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .select('name admissionNo createdAt className') // efficiently select needed fields
            .limit(5);

        res.json({
            students: studentCount,
            staff: staffCount,
            revenue: totalRevenue,
            recentFees,
            recentStudents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
