import api from './api';

export const storageService = {
    students: {
        getAll: async (searchString = '', params = {}) => {
            // Build query string
            const queryParams = new URLSearchParams();
            if (searchString) queryParams.append('search', searchString);

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value);
                }
            });

            const url = queryParams.toString() ? `/students?${queryParams.toString()}` : '/students';
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
        },
        downloadReceipt: async (feeId, receiptNo) => {
            const response = await api.get(`/fees/${feeId}/receipt`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt-${receiptNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
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
                joinDate: s.joiningDate, // Map joiningDate -> joinDate
                fixedSalary: s.salary || 0,
                paymentMode: s.paymentMode || 'Cash',
                category: s.category || 'Teacher'
            }));
        },
        add: async (staffMember) => {
            // Frontend sends: name, role, contact, email, subject, qualification
            // Backend expects: name, role, phone, email, subjects, qualification
            const payload = {
                ...staffMember,
                phone: staffMember.contact,
                subjects: [staffMember.subject],
                joiningDate: staffMember.joinDate,
                // Pass salary fields as is
                category: staffMember.category,
                salary: staffMember.fixedSalary,
                paymentMode: staffMember.paymentMode
            };
            const { data } = await api.post('/staff', payload);
            return {
                ...data,
                id: data._id,
                contact: data.phone,
                subject: data.subjects[0],
                joinDate: data.joiningDate
            };
        },
        update: async (id, staffMember) => {
            const payload = {
                ...staffMember,
                phone: staffMember.contact,
                subjects: [staffMember.subject],
                joiningDate: staffMember.joinDate,
                category: staffMember.category,
                salary: staffMember.fixedSalary,
                paymentMode: staffMember.paymentMode
            };
            const { data } = await api.put(`/staff/${id}`, payload);
            return {
                ...data,
                id: data._id,
                contact: data.phone,
                subject: data.subjects && data.subjects.length > 0 ? data.subjects[0] : 'N/A',
                joinDate: data.joiningDate,
                fixedSalary: data.salary || 0,
                paymentMode: data.paymentMode || 'Cash',
                category: data.category || 'Teacher'
            };
        },
        remove: async (id) => {
            const { data } = await api.delete(`/staff/${id}`);
            return data;
        }
    },
    dashboard: {
        getStats: async () => {
            const { data } = await api.get('/dashboard');
            return data;
        }
    },
    teacher: {
        getStats: async () => {
            const { data } = await api.get('/teacher/stats');
            return data;
        },
        getClasses: async () => {
            const { data } = await api.get('/teacher/classes');
            return data;
        },
        getClassStudents: async (className, sectionName) => {
            const { data } = await api.get(`/teacher/classes/${className}/${sectionName}/students`);
            return data;
        },
        getClassMarks: async (className, sectionName) => {
            const { data } = await api.get(`/teacher/classes/${className}/${sectionName}/marks`);
            return data;
        },
        getSalaryHistory: async () => {
            const { data } = await api.get('/teacher/salary-history');
            return data;
        },
        getProfile: async () => {
            const { data } = await api.get('/teacher/profile');
            return data;
        },
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
        },
        pay: async (id, paymentMode, remarks) => {
            const { data } = await api.put(`/salaries/${id}/pay`, { paymentMode, remarks });
            return data;
        },
        getSummary: async (month) => {
            const { data } = await api.get(`/salaries/summary?month=${month}`);
            return data;
        }
    },
    academics: {
        getClasses: async () => {
            const { data } = await api.get('/academics/classes');
            return data;
        }
    },
    attendance: {
        mark: async (attendanceData) => {
            const { data } = await api.post('/attendance/mark', attendanceData);
            return data;
        },
        getByClass: async (className, sectionName, date) => {
            const { data } = await api.get(`/attendance/class/${className}/${sectionName}?date=${date}`);
            return data;
        },
        getStudent: async (studentId, params = '') => {
            const { data } = await api.get(`/attendance/student/${studentId}${params}`);
            return data;
        },
        getReport: async (className, section, params) => {
            const queryParams = new URLSearchParams(params).toString();
            const { data } = await api.get(`/attendance/report/${className}/${section}?${queryParams}`);
            return data;
        }
    },
    staffAttendance: {
        mark: async (attendanceData) => {
            const { data } = await api.post('/staff-attendance/mark', attendanceData);
            return data;
        },
        getDay: async (date) => {
            const { data } = await api.get(`/staff-attendance/day?date=${date}`);
            return data;
        },
        getSummary: async (params) => {
            const queryParams = new URLSearchParams(params).toString();
            const { data } = await api.get(`/staff-attendance/summary?${queryParams}`);
            return data;
        },
        getMyAttendance: async (params = {}) => {
            const queryParams = new URLSearchParams(params).toString();
            const { data } = await api.get(`/staff-attendance/my-attendance?${queryParams}`);
            return data;
        }
    },
    student: {
        getSchedule: async () => {
            const { data } = await api.get('/timetable/student');
            // Backend returns Timetable object, dashboard expects array of sessions?
            // Actually StudentDashboard.jsx (ll. 98-110) expects an array of sessions with periods.
            // Let's check the Timetable model. 
            // The model has 'schedule' which is an array of { day, slots: [{ slotNumber, subject, teacher, note }] }
            // The dashboard expects: [{ periods: { startTime, subject, teacher: { name } }, dayOfWeek }]

            if (!data || !data.schedule || !data.periodTemplate) return [];

            const sessions = [];
            data.schedule.forEach(dayEntry => {
                dayEntry.slots.forEach(slot => {
                    if (slot.subject) {
                        // periodTemplate uses 'slots', not 'periods'
                        const templateSlot = data.periodTemplate.slots?.find(p => p.slotNumber === slot.slotNumber);
                        sessions.push({
                            periods: {
                                startTime: templateSlot ? templateSlot.startTime : `Slot ${slot.slotNumber}`,
                                endTime: templateSlot ? templateSlot.endTime : '',
                                subject: slot.subject.name,
                                teacher: slot.teacher
                            },
                            dayOfWeek: dayEntry.day
                        });
                    }
                });
            });
            return sessions;
        },
        getAssignments: async () => {
            const { data } = await api.get('/assignments/student');
            return data;
        },
        getFees: async () => {
            const { data } = await api.get('/fees/student');
            return data;
        },
        getProfile: async () => {
            const { data } = await api.get('/students/me');
            return data;
        }
    }
};
