/**
 * Utility functions for fee calculations
 */

export const CONVEYANCE_SLABS = [
    { id: 0, label: 'None (Self/Private)', monthly: 0 },
    { id: 1, label: 'Slab 1 (0-2 km)', monthly: 300 },
    { id: 2, label: 'Slab 2 (2-5 km)', monthly: 400 },
    { id: 3, label: 'Slab 3 (5-8 km)', monthly: 500 },
    { id: 4, label: 'Slab 4 (8-12 km)', monthly: 600 },
    { id: 5, label: 'Slab 5 (>12 km)', monthly: 700 }
];

export const calculateConveyanceFee = (slabId) => {
    const slab = CONVEYANCE_SLABS.find(s => s.id === parseInt(slabId));
    return slab ? slab.monthly : 0;
};

// Assuming 10 months for academic year billing of transport
export const calculateTotalConveyanceFee = (slabId, months = 10) => {
    return calculateConveyanceFee(slabId) * months;
};

export const getFeeStructure = (className) => {
    // This could also be moved here from mockData/feeStructure if we want a single source of truth
    // keeping it simple for now and just focusing on conveyance
    return {
        tuition: 20000,
        materials: 6500
    };
};

/**
 * Calculates a detailed fee breakdown for a student based on their history and active categories.
 * Ported from StudentDetails.jsx for reusability.
 */
export const calculateDetailedFeeBreakdown = (student, feeHistory, activeCategories) => {
    const breakdown = [];
    const slab = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
    let totalFeeComputed = 0;
    let totalPaidComputed = 0;

    const feeDetails = {
        paid: 0,
        pending: 0,
        totalFee: 0,
        monthlyConveyance: calculateConveyanceFee(slab),
        breakdown: []
    };

    // Calculate paid per category from history breakdown
    const categoryPaid = {};
    feeHistory.forEach(txn => {
        let txnAmountLeft = txn.amount || 0;
        if (txn.breakdown && txn.breakdown.length > 0) {
            txn.breakdown.forEach(item => {
                const normalizedName = item.feeType?.trim().toLowerCase();
                if (normalizedName) {
                    categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + item.amount;
                }
            });
        } else if (txn.feeType) {
            const normalizedName = txn.feeType.trim().toLowerCase();
            categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + txnAmountLeft;
        }
        totalPaidComputed += (txn.amount || 0);
    });

    const currentClassName = student.className || student.class;
    const studentDiscounts = student.discounts || [];

    activeCategories.forEach(category => {
        const normalizedCatName = category.name.trim().toLowerCase();
        let annualTotal = 0;
        let monthlyAmount = 0;

        if (category.hasSlabs) {
            if (slab > 0) {
                const baseMonthly = category.baseAmount || 0;
                monthlyAmount = baseMonthly + (slab * (category.slabMultiplier || 0));
                annualTotal = monthlyAmount * (category.months || 10);
            }
        } else {
            const classSpecific = category.amounts?.find(a => a.className === currentClassName);
            annualTotal = classSpecific ? classSpecific.amount : (category.baseAmount || 0);
            monthlyAmount = annualTotal / (category.months || 10);
        }

        if (annualTotal > 0) {
            const discountEntry = studentDiscounts.find(d =>
                d.categoryId?.toString() === category._id?.toString() ||
                d.categoryName?.toLowerCase() === normalizedCatName
            );
            const discountAmt = discountEntry?.discountAmount || 0;
            const netTotal = Math.max(0, annualTotal - discountAmt);

            totalFeeComputed += netTotal;
            const paidForCat = categoryPaid[normalizedCatName] || 0;
            const pendingForCat = Math.max(0, netTotal - paidForCat);

            feeDetails.breakdown.push({
                id: category._id,
                name: category.name,
                type: category.type,
                total: annualTotal,
                discountAmount: discountAmt,
                netTotal: netTotal,
                paid: paidForCat,
                pending: pendingForCat,
                monthly: monthlyAmount,
                months: category.months || 10
            });
        }
    });

    feeDetails.paid = totalPaidComputed;
    feeDetails.totalFee = totalFeeComputed;
    feeDetails.pending = Math.max(0, totalFeeComputed - totalPaidComputed);

    return feeDetails;
};
