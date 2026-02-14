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
