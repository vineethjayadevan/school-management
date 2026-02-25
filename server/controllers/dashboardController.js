const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // 1. Basic Counts
        // Use a more inclusive query for the transition period: Active or status not yet set
        const studentCount = await Student.countDocuments({
            $or: [
                { studentStatus: 'Active' },
                { studentStatus: { $exists: false } }
            ],
            isActive: true
        });
        const staffCount = await Staff.countDocuments({ status: 'Active' });

        // 2. Financials (This Month)
        // Fees Collected This Month
        const feeCollectedAggregation = await Fee.aggregate([
            {
                $match: {
                    paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const feesCollectedThisMonth = feeCollectedAggregation.length > 0 ? feeCollectedAggregation[0].total : 0;

        // Salary Paid This Month
        // We need to query the Salary model (implied from previous context)
        // Assuming Salary model exists and has 'month' field (YYYY-MM) or paymentDate
        const Salary = require('../models/Salary');
        const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM

        const salaryAggregation = await Salary.aggregate([
            { $match: { month: currentMonthStr } },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] } },
                    totalPending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, "$amount", 0] } }
                }
            }
        ]);
        const salaryStats = salaryAggregation.length > 0 ? salaryAggregation[0] : { totalPaid: 0, totalPending: 0 };


        // 3. Activity Panel Counts
        // Pending Admissions (Assumed status 'Pending' or similar, otherwise mock or count recent)
        // If Student model doesn't have 'Pending' status, we might count students added today?
        // Let's assume 'Inactive' or just recent additions for now.
        const recentAdmissionsCount = await Student.countDocuments({
            createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });

        // Fees Overdue (This is complex without a robust due date system, let's approximation or 0)
        // Or count students with pending balance? 
        // For now, let's return 0 or placeholder
        const feesOverdueCount = 0;

        // Pending Salaries Count
        const pendingSalaryCount = await Salary.countDocuments({ month: currentMonthStr, status: 'Pending' });

        // 4. Recent Activity Logs
        // Recent 5 fee transactions
        const recentFees = await Fee.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name');

        // Recent 5 admissions
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .select('name admissionNo createdAt className')
            .limit(5);

        // 5. Chart Data (Last 6 Months Revenue)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueChartData = await Fee.aggregate([
            {
                $match: {
                    paymentDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$paymentDate" },
                        year: { $year: "$paymentDate" }
                    },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format chart data
        const formattedChartData = revenueChartData.map(item => ({
            name: `${item._id.month}/${item._id.year}`, // Simple label
            uv: item.amount // 'uv' is common in Recharts for data
        }));


        res.json({
            counts: {
                students: studentCount,
                staff: staffCount,
                admissionsToday: recentAdmissionsCount,
                feesOverdue: feesOverdueCount,
                pendingSalaries: pendingSalaryCount
            },
            financials: {
                feesCollectedThisMonth,
                feesPending: 0, // Placeholder, usually requires expected - collected
                salaryPaidThisMonth: salaryStats.totalPaid,
                salaryPendingThisMonth: salaryStats.totalPending
            },
            recentFees,
            recentStudents,
            chartData: formattedChartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
