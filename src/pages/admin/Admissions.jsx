import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { UserPlus, ArrowRight, Loader, PlusCircle } from 'lucide-react';

const Admissions = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchAdmittedStudents();
    }, []);

    const fetchAdmittedStudents = async () => {
        try {
            const { data } = await api.get('/enquiries');
            // Filter strictly for 'Admitted' status
            const readyStudents = data.filter(s => s.status === 'Admitted');
            setStudents(readyStudents);
        } catch (error) {
            addToast('Failed to fetch admitted students', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdmit = (student) => {
        // Navigate to Admission Form with pre-filled data
        navigate('/admin/admissions/new', {
            state: {
                prefill: {
                    firstName: student.studentFirstName,
                    middleName: student.studentMiddleName || '',
                    lastName: student.studentLastName,
                    // Fallback for logic that still uses 'name', though form uses split fields
                    name: student.studentFirstName ? `${student.studentFirstName} ${student.studentMiddleName ? student.studentMiddleName + ' ' : ''}${student.studentLastName}` : student.studentName,
                    dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
                    class: student.studentGrade,
                    gender: student.studentGender,
                    bloodGroup: student.studentBloodGroup,
                    fatherName: student.fatherName,
                    motherName: student.motherName,
                    guardian: student.fatherName,
                    contact: student.contactNumber,
                    email: student.email,
                    address: student.address || '',
                    enquiryId: student._id
                }
            }
        });
    };

    const handleManualAdmission = () => {
        navigate('/admin/admissions/new');
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admissions</h1>
                    <p className="text-slate-500">Manage incoming students and new enrollments.</p>
                </div>
                <button
                    onClick={handleManualAdmission}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10 font-medium"
                >
                    <PlusCircle size={20} />
                    <span>New Manual Admission</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <UserPlus size={16} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">Ready for Admission</h2>
                        <p className="text-sm text-slate-500">Applications approved by office staff</p>
                    </div>
                </div>

                {students.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No pending applications from office.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Grade</th>
                                    <th className="p-4">Parent Details</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900">
                                            {student.studentFirstName ? `${student.studentFirstName} ${student.studentLastName}` : student.studentName}
                                        </td>
                                        <td className="p-4 text-slate-600">{student.studentGrade}</td>
                                        <td className="p-4 text-slate-600">
                                            <div className="text-sm">
                                                <span className="font-semibold">{student.fatherName || 'Parent'}</span>
                                                <span className="text-xs text-slate-400 block">{student.motherName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">{student.contactNumber}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleAdmit(student)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                            >
                                                Admit Student <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admissions;
