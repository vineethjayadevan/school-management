import { useRef } from 'react';
// import { useReactToPrint } from 'react-to-print'; // Removed
import { Printer, Download, CheckCircle, School } from 'lucide-react';
import { SCHOOL_INFO } from '../../utils/schoolInfo';
import html2pdf from 'html2pdf.js';

const FeeReceipt = ({ transaction, student, onNext, isPreview, onConfirm }) => {
    const componentRef = useRef();

    const handleDownload = () => {
        const element = componentRef.current;
        const opt = {
            margin: 10,
            filename: `Receipt-${transaction.receiptNo || 'New'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleConfirm = async () => {
        if (onConfirm) {
            await onConfirm();
        }
    };

    // School Info from constants
    const schoolInfo = SCHOOL_INFO;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className={`flex items-center gap-2 font-bold ${isPreview ? 'text-amber-600' : 'text-green-600'}`}>
                    {isPreview ? (
                        <>
                            <Printer size={24} />
                            <span>Preview Challan</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={24} />
                            <span>Payment Successful</span>
                        </>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onNext}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        {isPreview ? 'Back / Edit' : 'Close / Next'}
                    </button>

                    {isPreview ? (
                        <button
                            onClick={handleConfirm}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-medium transition-shadow hover:shadow-lg hover:shadow-emerald-500/30"
                        >
                            <CheckCircle size={18} />
                            Confirm & Pay
                        </button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-shadow hover:shadow-lg hover:shadow-indigo-500/30"
                        >
                            <Download size={18} />
                            Download E-Challan
                        </button>
                    )}
                </div>
            </div>

            {/* Printable Receipt Area */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200" ref={componentRef}>
                <style type="text/css" media="print">
                    {`
                        @page { size: auto; margin: 20mm; }
                        body { -webkit-print-color-adjust: exact; }
                    `}
                </style>

                {/* Header */}
                <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img src="/images/logo.webp" alt="School Logo" className="h-16 w-auto" />
                        {/* <School size={32} className="text-indigo-600" /> */}
                        <h1 className="text-3xl font-bold text-slate-900">{schoolInfo.name}</h1>
                    </div>
                    <p className="text-slate-500">{schoolInfo.address}</p>
                    <p className="text-slate-500">{schoolInfo.phone} | {schoolInfo.email}</p>
                    <div className="mt-4 inline-block px-4 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-600 tracking-wide uppercase">
                        Fee Receipt / E-Challan
                    </div>
                </div>

                {/* Receipt Details Grid */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-8">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Receipt No</p>
                        <p className="text-lg font-mono font-bold text-slate-900">{transaction.receiptNo || 'PENDING'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Date</p>
                        <p className="text-lg font-medium text-slate-900">{new Date(transaction.date || transaction.paymentDate).toLocaleDateString()}</p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Student Name</p>
                        <p className="text-lg font-bold text-slate-900">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.className} - {student.section} | Roll: {student.rollNo}</p>
                        <p className="text-sm text-slate-500">ID: {student.admissionNo}</p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Parent / Guardian</p>
                        <p className="text-lg font-medium text-slate-900">{student.guardian}</p>
                        <p className="text-sm text-slate-500">{student.primaryPhone}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold text-left">
                            <tr>
                                <th className="px-6 py-3">Fee Description</th>
                                <th className="px-6 py-3">Mode</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            <tr>
                                <td className="px-6 py-4 font-medium text-slate-900">{transaction.type}</td>
                                <td className="px-6 py-4 text-slate-600">{transaction.mode}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">₹{Number(transaction.amount).toLocaleString()}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-right font-bold text-slate-900">Total Paid</td>
                                <td className="px-6 py-4 text-right font-bold text-indigo-600 text-lg">₹{Number(transaction.amount).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Notes */}
                <div className="grid grid-cols-2 gap-8 items-end">
                    <div className="text-xs text-slate-400 space-y-1">
                        <p>* This is a computer generated receipt.</p>
                        <p>* Fees once paid are not refundable.</p>
                        <p>* Cheque payments subject to realization.</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 mb-2 flex items-end justify-center">
                            {/* Signature Placeholder */}
                            <div className="font-script text-2xl text-slate-400 opacity-50">Authorized Signatory</div>
                        </div>
                        <div className="border-t border-slate-300 w-full pt-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Cashier Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
