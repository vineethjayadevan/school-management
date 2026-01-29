export const mockStudents = [
    {
        id: 'STU001',
        name: 'Aarav Sharma',
        class: 'Class 10',
        section: 'A',
        rollNo: '1001',
        status: 'Active',
        guardian: 'Rajesh Sharma',
        contact: '9876543210',
        feesStatus: 'Paid',
        category: 'General',
        admissionDate: '2023-04-01',
    },
    {
        id: 'STU002',
        name: 'Isha Patel',
        class: 'Class 10',
        section: 'A',
        rollNo: '1002',
        status: 'Active',
        guardian: 'Suresh Patel',
        contact: '9876543211',
        feesStatus: 'Pending',
        category: 'OBC',
        admissionDate: '2023-04-02',
    },
    {
        id: 'STU003',
        name: 'Rohan Gupta',
        class: 'Class 9',
        section: 'B',
        rollNo: '9001',
        status: 'Defaulter',
        guardian: 'Amit Gupta',
        contact: '9876543212',
        feesStatus: 'Overdue',
        category: 'General',
        admissionDate: '2023-04-05',
    },
    {
        id: 'STU004',
        name: 'Ananya Singh',
        class: 'Class 8',
        section: 'C',
        rollNo: '8005',
        status: 'Active',
        guardian: 'Vikram Singh',
        contact: '9876543213',
        feesStatus: 'Paid',
        category: 'SC',
        admissionDate: '2023-04-10',
    },
    {
        id: 'STU005',
        name: 'Vivaan Kumar',
        class: 'Class 5',
        section: 'A',
        rollNo: '5001',
        status: 'Inactive',
        guardian: 'Sanjay Kumar',
        contact: '9876543214',
        feesStatus: 'Paid',
        category: 'General',
        admissionDate: '2022-04-01',
    },
];

export const feeStructure = {
    'Class 10': { tuition: 20000, materials: 6500 },
    'Class 9': { tuition: 20000, materials: 6500 },
    'Class 8': { tuition: 20000, materials: 6500 },
    'Class 7': { tuition: 20000, materials: 6500 },
    'Class 6': { tuition: 20000, materials: 6500 },
    'Class 5': { tuition: 20000, materials: 6500 },
    'Class 4': { tuition: 20000, materials: 6500 },
    'Class 3': { tuition: 20000, materials: 6500 },
    'Class 2': { tuition: 20000, materials: 6500 },
    'Class 1': { tuition: 20000, materials: 6500 },
    'KG 1': { tuition: 20000, materials: 6500 },
    'KG 2': { tuition: 20000, materials: 6500 },
};

export const mockFees = [
    {
        id: 'TXN001',
        studentId: 'STU001',
        amount: 5000,
        type: 'Tuition Fee',
        date: '2023-04-05',
        mode: 'Online',
        status: 'Success'
    },
    {
        id: 'TXN002',
        studentId: 'STU004',
        amount: 1500,
        type: 'Transport Fee',
        date: '2023-04-06',
        mode: 'Cash',
        status: 'Success'
    }
];

export const mockStaff = [
    {
        id: 'EMP001',
        name: 'Sarah Wilson',
        role: 'Teacher',
        subject: 'Mathematics',
        qualification: 'M.Sc Mathematics',
        contact: '9876543220',
        joinDate: '2020-06-15',
        status: 'Active',
        email: 'sarah.w@school.com'
    },
    {
        id: 'EMP002',
        name: 'James Anderson',
        role: 'Teacher',
        subject: 'Science',
        qualification: 'B.Ed, M.Sc Physics',
        contact: '9876543221',
        joinDate: '2019-04-01',
        status: 'Active',
        email: 'james.a@school.com'
    },
    {
        id: 'EMP003',
        name: 'Emily Davis',
        role: 'Admin',
        subject: 'N/A',
        qualification: 'MBA',
        contact: '9876543222',
        joinDate: '2018-01-10',
        status: 'Active',
        email: 'emily.d@school.com'
    },
    {
        id: 'EMP004',
        name: 'Michael Brown',
        role: 'Teacher',
        subject: 'English',
        qualification: 'MA English',
        contact: '9876543223',
        joinDate: '2021-08-20',
        status: 'On Leave',
        email: 'michael.b@school.com'
    }
];

export const mockClasses = [
    { id: 'CLS01', name: 'Class 1', sections: ['A', 'B'] },
    { id: 'CLS02', name: 'Class 2', sections: ['A', 'B', 'C'] },
    { id: 'CLS03', name: 'Class 3', sections: ['A', 'B'] },
    { id: 'CLS04', name: 'Class 4', sections: ['A'] },
    { id: 'CLS05', name: 'Class 5', sections: ['A', 'B'] },
    { id: 'CLS06', name: 'Class 6', sections: ['A'] },
    { id: 'CLS07', name: 'Class 7', sections: ['A', 'B'] },
    { id: 'CLS08', name: 'Class 8', sections: ['A', 'B', 'C'] },
    { id: 'CLS09', name: 'Class 9', sections: ['A', 'B'] },
    { id: 'CLS10', name: 'Class 10', sections: ['A', 'B'] },
];

export const mockSubjects = [
    { id: 'SUB01', name: 'Mathematics', code: 'MATH101', type: 'Core' },
    { id: 'SUB02', name: 'Science', code: 'SCI101', type: 'Core' },
    { id: 'SUB03', name: 'English', code: 'ENG101', type: 'Core' },
    { id: 'SUB04', name: 'Social Studies', code: 'SST101', type: 'Core' },
    { id: 'SUB05', name: 'Computer Science', code: 'CS101', type: 'Elective' },
    { id: 'SUB06', name: 'Art', code: 'ART101', type: 'Elective' },
];
