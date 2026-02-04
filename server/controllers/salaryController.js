const Salary = require('../models/Salary');
const Staff = require('../models/Staff');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

// @desc    Get salaries for a specific month (Auto-generate if missing for active staff)
// @route   GET /api/salaries?month=YYYY-MM
// @access  Admin
const getSalariesByMonth = async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) {
            return res.status(400).json({ message: 'Month is required (YYYY-MM)' });
        }

        // 1. Get all active staff
        const activeStaff = await Staff.find({ status: 'Active' });

        // 2. Get existing salary records for this month
        const existingSalaries = await Salary.find({ month }).populate('staff');

        // 3. Identify missing staff (who are active but have no salary record for this month)
        const salaryStaffIds = new Set(existingSalaries.map(s => s.staff._id.toString()));
        const missingStaff = activeStaff.filter(s => !salaryStaffIds.has(s._id.toString()));

        // 4. Create pending salary records for missing staff
        const newSalaries = [];
        for (const staff of missingStaff) {
            if (staff.salary > 0) { // Only create if they have a salary defined
                newSalaries.push({
                    staff: staff._id,
                    month,
                    amount: staff.salary,
                    status: 'Pending',
                    paymentMode: staff.paymentMode || 'Cash', // Default to staff's preferred mode
                });
            }
        }

        if (newSalaries.length > 0) {
            await Salary.insertMany(newSalaries);
        }

        // 5. Fetch updated list
        const salaries = await Salary.find({ month })
            .populate('staff', 'name role department category')
            .sort({ 'staff.name': 1 }); // Sorting might need manual handling if populate doesn't sort deeply easily, but this is fine for now

        res.json(salaries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark salary as paid
// @route   PUT /api/salaries/:id/pay
// @access  Admin
const paySalary = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMode, remarks } = req.body;

        const salary = await Salary.findById(id).populate('staff');

        if (!salary) {
            return res.status(404).json({ message: 'Salary record not found' });
        }

        if (salary.status === 'Paid') {
            return res.status(400).json({ message: 'Salary is already paid' });
        }

        // 1. Update Salary Record
        salary.status = 'Paid';
        salary.paymentDate = new Date();
        salary.paymentMode = paymentMode || salary.paymentMode;
        salary.remarks = remarks || salary.remarks;
        salary.paidBy = req.user._id;

        await salary.save();

        // 2. Create Expense Record
        // Find 'Salary' subcategory or fallback
        // We'll assume 'Operational Expenses' -> 'Salary' or just 'Salary' category based on system setup.
        // For robustness, we'll try to find an appropriate category.

        // Hardcoding standard categories for now, but ideally query DB
        const expensePayload = {
            title: `Salary - ${salary.staff.name}`,
            category: 'Operational Expenses', // Common default
            subcategory: 'Salary',
            amount: salary.amount,
            date: new Date(),
            description: `Monthly salary for ${salary.staff.name} (${salary.month})`,
            referenceType: 'Voucher',
            addedBy: req.user._id
        };

        await Expense.create(expensePayload);

        res.json({ message: 'Salary paid and expense recorded', salary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get salary summary for a month
// @route   GET /api/salaries/summary?month=YYYY-MM
// @access  Admin
const getSalarySummary = async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ message: 'Month required' });

        const salaries = await Salary.find({ month });

        const summary = {
            totalStaff: salaries.length,
            totalLiability: salaries.reduce((sum, s) => sum + s.amount, 0),
            totalPaid: salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0),
            totalPending: salaries.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.amount, 0),
            paidCount: salaries.filter(s => s.status === 'Paid').length,
            pendingCount: salaries.filter(s => s.status === 'Pending').length
        };

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSalariesByMonth,
    paySalary,
    getSalarySummary
};
