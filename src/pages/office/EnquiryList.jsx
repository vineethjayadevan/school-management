import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Phone, Mail, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EnquiryList = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        try {
            const { data } = await api.get('/enquiries');
            setEnquiries(data);
        } catch (error) {
            addToast('Failed to fetch enquiries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [confirmRejectId, setConfirmRejectId] = useState(null);

    const updateStatus = async (id, newStatus) => {
        try {
            const { data } = await api.put(`/enquiries/${id}`, { status: newStatus });
            setEnquiries(enquiries.map(enq => enq._id === id ? data : enq));
            addToast(`Enquiry marked as ${newStatus}`, 'success');
            if (newStatus === 'Rejected') setConfirmRejectId(null);
        } catch (error) {
            addToast('Failed to update status', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-800';
            case 'Contacted': return 'bg-yellow-100 text-yellow-800';
            case 'Admitted': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Closed': return 'bg-slate-100 text-slate-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) return <div className="p-8 text-center">Loading enquiries...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Admissions Enquiries</h1>
                <p className="text-slate-600">Manage incoming admission requests and follow-ups.</p>
            </header>

            <div className="grid gap-4">
                {enquiries.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">No enquiries found yet.</p>
                    </div>
                ) : (
                    enquiries.map((enquiry) => (
                        <div key={enquiry._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">
                                            {enquiry.studentFirstName ? `${enquiry.studentFirstName} ${enquiry.studentLastName}` : enquiry.studentName}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(enquiry.status)}`}>
                                            {enquiry.status === 'Admitted' ? 'Submitted' : enquiry.status}
                                        </span>
                                        <span className="text-sm text-slate-500">Grade: {enquiry.studentGrade}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Phone size={14} /> {enquiry.contactNumber}
                                        </div>
                                        {enquiry.email && (
                                            <div className="flex items-center gap-1">
                                                <Mail size={14} /> {enquiry.email}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} /> {new Date(enquiry.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2 bg-slate-50 p-3 rounded-lg">
                                        <MessageSquare size={16} className="text-slate-400 mt-1 shrink-0" />
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block mb-1">
                                                Parents: {enquiry.fatherName ? `${enquiry.fatherName} & ${enquiry.motherName}` : enquiry.name}
                                            </span>
                                            <p className="text-slate-700">{enquiry.message || "No message provided."}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start flex-wrap justify-end">
                                    {/* Action Buttons */}
                                    {enquiry.status !== 'Rejected' && enquiry.status !== 'Admitted' && enquiry.status !== 'Enrolled' && enquiry.status !== 'Closed' && (
                                        <>
                                            {enquiry.status === 'New' && (
                                                <button
                                                    onClick={() => updateStatus(enquiry._id, 'Contacted')}
                                                    className="px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                    <Phone size={16} /> Mark Contacted
                                                </button>
                                            )}

                                            {enquiry.status === 'Contacted' && (
                                                <button
                                                    onClick={() => updateStatus(enquiry._id, 'Admitted')}
                                                    className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Submit For Admission
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setConfirmRejectId(enquiry._id)}
                                                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reject Confirmation Modal */}
            <AnimatePresence>
                {confirmRejectId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Application?</h3>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to reject this student? This will move the application to the rejected list.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmRejectId(null)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateStatus(confirmRejectId, 'Rejected')}
                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EnquiryList;
