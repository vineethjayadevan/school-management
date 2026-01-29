import api from './api';

export const storageService = {
    students: {
        getAll: async (searchString = '') => {
            // Pass search param if provided
            const url = searchString ? `/students?search=${searchString}` : '/students';
            const { data } = await api.get(url);
            return data.map(s => ({ ...s, id: s._id }));
        },
        getById: async (id) => {
            const { data } = await api.get(`/students/${id}`);
            return { ...data, id: data._id };
        },
        add: async (student) => {
            const { data } = await api.post('/students', student);
            return { ...data, id: data._id };
        },
        update: async (id, data) => {
            const { data: updated } = await api.put(`/students/${id}`, data);
            return { ...updated, id: updated._id };
        }
    },
    fees: {
        getAll: async () => {
            const { data } = await api.get('/fees');
            return data.map(f => ({ ...f, id: f._id }));
        },
        add: async (transaction) => {
            const { data } = await api.post('/fees', transaction);
            return { ...data, id: data._id };
        },
        getByStudent: async (studentId) => {
            const { data } = await api.get(`/fees/student/${studentId}`);
            return data;
        }
    },
    staff: {
        getAll: async () => {
            const { data } = await api.get('/staff');
            // Map backend fields to frontend expected fields
            return data.map(s => ({
                ...s,
                id: s._id,
                contact: s.phone, // Map phone -> contact
                subject: s.subjects && s.subjects.length > 0 ? s.subjects[0] : 'N/A', // Map subjects[] -> single subject string (for UI)
                joinDate: s.joiningDate // Map joiningDate -> joinDate
            }));
        },
        add: async (staffMember) => {
            // Frontend sends: name, role, contact, email, subject, qualification
            // Backend expects: name, role, phone, email, subjects, qualification
            const payload = {
                ...staffMember,
                phone: staffMember.contact,
                subjects: [staffMember.subject],
                joiningDate: staffMember.joinDate
            };
            const { data } = await api.post('/staff', payload);
            return {
                ...data,
                id: data._id,
                contact: data.phone,
                subject: data.subjects[0],
                joinDate: data.joiningDate
            };
        }
    },
    dashboard: {
        getStats: async () => {
            const { data } = await api.get('/dashboard');
            return data;
        }
    },
    teacher: {
        getSchedule: async () => {
            const { data } = await api.get('/timetable/teacher');
            return data;
        },
        getAssignments: async () => {
            const { data } = await api.get('/assignments/teacher');
            return data;
        },
        createAssignment: async (assignment) => {
            const { data } = await api.post('/assignments', assignment);
            return data;
        }
    },
    student: {
        getSchedule: async () => {
            const { data } = await api.get('/timetable/student');
            return data;
        },
        getAssignments: async () => {
            const { data } = await api.get('/assignments/student');
            return data;
        },
        getFees: async () => {
            const { data } = await api.get('/fees/student');
            return data;
        }
    }
};
