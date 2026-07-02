import React, { useState, useEffect } from 'react';
import { Search, Bus, Check, Calendar, CreditCard, Clock, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import FeeReceipt from '../../components/fees/FeeReceipt';

const VEHICLE_MONTHS = [
    { id: 'Jun 2026', label: 'June' },
    { id: 'Jul 2026', label: 'July' },
    { id: 'Aug 2026', label: 'August' },
    { id: 'Sep 2026', label: 'September' },
    { id: 'Oct 2026', label: 'October' },
    { id: 'Nov 2026', label: 'November' },
    { id: 'Dec 2026', label: 'December' },
    { id: 'Jan 2027', label: 'January' },
    { id: 'Feb 2027', label: 'February' },
    { id: 'Mar 2027', label: 'March' },
];

export default function VehicleFeeCollection() {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewTransaction, setPreviewTransaction] = useState(null);
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
    const { addToast } = useToast();
    const { user } = useAuth();

    // Auto-search when query changes
    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchStudents();
        } else {
            setStudents([]);
        }
    }, [searchQuery]);

    const searchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/students?search=${searchQuery}&status=Active`);
            // Only show students who have a monthly vehicle fee assigned
            const studentsList = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const vehicleStudents = studentsList.filter(s => s.monthlyConveyanceFee > 0);
            setStudents(vehicleStudents);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSelectedMonths([]);
        setStudents([]);
        setSearchQuery('');
    };

    const handleToggleMonth = (monthId) => {
        if (selectedMonths.includes(monthId)) {
            setSelectedMonths(selectedMonths.filter(id => id !== monthId));
        } else {
            setSelectedMonths([...selectedMonths, monthId]);
        }
    };

    const handlePreviewFee = () => {
        if (selectedMonths.length === 0) {
            addToast('Please select at least one month.', 'error');
            return;
        }
        if (paymentMode !== 'Cash' && !transactionId) {
            addToast('Transaction ID required for non-cash payments.', 'error');
            return;
        }

        const amount = selectedStudent.monthlyConveyanceFee * selectedMonths.length;
        
        const fakeTxn = {
            receiptNo: (() => {
                const now = new Date();
                const ts = now.getFullYear().toString() +
                    (now.getMonth() + 1).toString().padStart(2, '0') +
                    now.getDate().toString().padStart(2, '0') +
                    now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0') +
                    now.getSeconds().toString().padStart(2, '0');
                return `${ts}-${selectedStudent.admissionNo}`;
            })(),
            date: new Date().toISOString(),
            amount: amount,
            mode: paymentMode,
            transactionId: paymentMode !== 'Cash' ? transactionId : undefined,
            type: 'Vehicle Fee',
            breakdown: selectedMonths.map(month => ({
                feeType: `Vehicle Fee - ${month}`,
                amount: selectedStudent.monthlyConveyanceFee
            }))
        };

        setPreviewTransaction(fakeTxn);
        setIsPaymentConfirmed(false);
        setShowPreview(true);
    };

    const handleFinalPayment = async () => {
        try {
            const payload = {
                studentId: selectedStudent._id,
                type: 'Vehicle Fee',
                amount: previewTransaction.amount,
                date: new Date().toISOString(),
                mode: paymentMode,
                transactionId: paymentMode !== 'Cash' ? transactionId : undefined,
                paidVehicleMonths: selectedMonths,
                breakdown: previewTransaction.breakdown
            };

            const res = await api.post('/fees', payload);
            addToast('Vehicle fee collected successfully!', 'success');
            
            setPreviewTransaction(res.data.insertedFee || res.data.fee || payload);
            setIsPaymentConfirmed(true);
            
            // Refresh student data
            const studentRes = await api.get(`/students/${selectedStudent._id}`);
            setSelectedStudent(studentRes.data);
            setSelectedMonths([]);
            setTransactionId('');
        } catch (error) {
            console.error('Fee collection failed:', error);
            addToast(error.response?.data?.message || 'Failed to collect vehicle fee', 'error');
            throw error; // Let FeeReceipt know it failed
        }
    };

    const closePreview = () => {
        setShowPreview(false);
        setPreviewTransaction(null);
    };

    const paidMonths = selectedStudent?.paidVehicleMonths || [];
    const totalAmount = selectedStudent ? selectedStudent.monthlyConveyanceFee * selectedMonths.length : 0;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 relative">
            {/* Receipt Modal */}
            {showPreview && previewTransaction && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white relative">
                        <button
                            onClick={closePreview}
                            className="absolute right-4 top-4 z-50 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                        <FeeReceipt
                            transaction={previewTransaction}
                            student={selectedStudent}
                            onNext={closePreview}
                            isPreview={!isPaymentConfirmed}
                            onConfirm={handleFinalPayment}
                        />
                    </div>
                </div>
            )}

            {!selectedStudent ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <Bus size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Vehicle Fee Collection</h2>
                        <p className="text-sm text-slate-500 text-center max-w-md">
                            Search for a student to collect their monthly vehicle fee. Only students with an assigned vehicle fee will appear.
                        </p>
                    </div>

                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name or Admission No..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                        />
                        
                        {loading && (
                            <div className="absolute right-4 top-3.5 text-slate-400">
                                <Clock className="animate-spin" size={20} />
                            </div>
                        )}

                        {students.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-80 overflow-y-auto z-50">
                                {students.map((student) => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleSelectStudent(student)}
                                        className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">{student.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Class: {student.className} | Adm: {student.admissionNo}
                                                {student.busNumber && ` | Bus: ${student.busNumber}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-blue-600">₹{student.monthlyConveyanceFee}/mo</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {searchQuery.length > 2 && students.length === 0 && !loading && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-slate-500 z-50">
                                No students found with an assigned vehicle fee.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Student Info & Month Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                        <Bus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Class: {selectedStudent.className} • Adm: {selectedStudent.admissionNo}
                                            {selectedStudent.busNumber && ` • Bus: ${selectedStudent.busNumber}`}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedStudent(null)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Change Student
                                </button>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Monthly Fee</p>
                                    <p className="text-xl font-bold text-slate-900">₹{selectedStudent.monthlyConveyanceFee.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Annual Total</p>
                                    <p className="text-lg font-bold text-slate-700">₹{(selectedStudent.monthlyConveyanceFee * 10).toLocaleString()}</p>
                                </div>
                            </div>

                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-slate-400" />
                                Select Months to Pay
                            </h4>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {VEHICLE_MONTHS.map(month => {
                                    const isPaid = paidMonths.includes(month.id);
                                    const isSelected = selectedMonths.includes(month.id);
                                    
                                    return (
                                        <button
                                            key={month.id}
                                            disabled={isPaid}
                                            onClick={() => handleToggleMonth(month.id)}
                                            className={`
                                                relative p-3 rounded-xl border text-center transition-all duration-200
                                                ${isPaid ? 'bg-green-50 border-green-200 cursor-not-allowed opacity-70' : 
                                                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md transform -translate-y-1' : 
                                                  'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50'}
                                            `}
                                        >
                                            <p className={`text-sm font-bold ${isSelected ? 'text-white' : isPaid ? 'text-green-800' : 'text-slate-700'}`}>
                                                {month.label}
                                            </p>
                                            <p className={`text-[10px] ${isSelected ? 'text-blue-100' : isPaid ? 'text-green-600' : 'text-slate-500'}`}>
                                                {isPaid ? 'Paid' : 'Unpaid'}
                                            </p>
                                            {isPaid && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment Summary */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Payment Summary</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Selected Months</span>
                                    <span className="font-semibold text-slate-900">{selectedMonths.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Fee per Month</span>
                                    <span className="font-semibold text-slate-900">₹{selectedStudent.monthlyConveyanceFee.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <span className="text-slate-800 font-bold">Total Amount</span>
                                        <span className="text-3xl font-black text-blue-600">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Payment Mode</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Cash', 'UPI', 'Bank Transfer', 'Card'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                                    paymentMode === mode 
                                                        ? 'bg-slate-800 border-slate-800 text-white' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {paymentMode !== 'Cash' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Transaction ID</label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="Enter ID/Ref No."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:border-slate-800 text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handlePreviewFee}
                                disabled={selectedMonths.length === 0}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                                    selectedMonths.length === 0 
                                        ? 'bg-slate-300 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                                }`}
                            >
                                <CreditCard size={20} />
                                Collect ₹{totalAmount.toLocaleString()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
