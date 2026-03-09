import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Clock, BookOpen, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function QuestionPaperViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef(null);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const res = await api.get(`/question-papers/${id}`);
                setPaper(res.data);
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Failed to load question paper.');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        fetchPaper();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!paper) return null;

    return (
        <div className="space-y-6 pb-20 print:bg-white print:p-0 print:space-y-0 print:text-black">

            {/* Header Actions - Hidden when printing */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden sticky top-0 z-40">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        <Printer size={18} />
                        Print / PDF
                    </button>
                    {/* Add download word doc later if needed */}
                </div>
            </div>

            {/* A4 Paper Container for View/Print */}
            <div
                ref={printRef}
                className="bg-white max-w-[210mm] min-h-[297mm] mx-auto shadow-sm border border-slate-200 print:shadow-none print:border-none p-8 sm:p-12 text-slate-800 print:p-0"
            >
                {/* School Header (Placeholder - should come from settings ideally) */}
                <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide">
                        STEM GLOBAL PUBLIC SCHOOL
                    </h1>
                    <h2 className="text-xl sm:text-2xl font-semibold mt-2">{paper.title}</h2>
                    <p className="text-slate-600 mt-1 font-medium italic">Academic Year: {paper.academicYear}</p>

                    <div className="flex flex-wrap justify-between items-center mt-6 text-sm font-semibold max-w-2xl mx-auto border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-slate-400 print:hidden" />
                            <span>Class: {paper.className || 'N/A'} {paper.section ? `(${paper.section})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Subject: {paper.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-700">
                            <span>Exam Type: {paper.examType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400 print:hidden" />
                            <span>Dur: {paper.duration || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Max Marks: {paper.totalMarks}</span>
                        </div>
                    </div>
                </div>

                {/* General Instructions */}
                {paper.instructions && (
                    <div className="mb-8 p-4 bg-slate-50 print:bg-transparent print:border print:border-slate-300 rounded-lg">
                        <h3 className="font-bold underline mb-2">General Instructions:</h3>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{paper.instructions}</p>
                    </div>
                )}

                {/* Question Sections */}
                <div className="space-y-10">
                    {paper.sections?.map((section, sIndex) => (
                        <div key={sIndex} className="space-y-4">

                            {/* Section Heading */}
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold uppercase tracking-wider">{section.title}</h3>
                                {section.instructions && (
                                    <p className="text-sm italic text-slate-600 mt-1">{section.instructions}</p>
                                )}
                            </div>

                            {/* Section Questions */}
                            <div className="space-y-6">
                                {section.questions?.map((q, qIndex) => (
                                    <div key={qIndex} className="flex gap-4">
                                        <div className="font-bold whitespace-nowrap pt-0.5">
                                            {qIndex + 1}.
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="whitespace-pre-wrap font-medium">{q.text}</p>
                                                <span className="font-bold whitespace-nowrap pt-0.5 text-sm">
                                                    [{q.marks}]
                                                </span>
                                            </div>

                                            {/* Options for MCQ */}
                                            {q.type === 'MCQ' && q.options?.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 pl-2">
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="flex gap-2">
                                                            <span className="font-medium">({String.fromCharCode(97 + oIndex)})</span>
                                                            <span>{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Options for True/False */}
                                            {q.type === 'TrueFalse' && (
                                                <div className="flex gap-8 pl-2">
                                                    <div className="flex gap-2">
                                                        <span className="font-medium">(a)</span> True
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="font-medium">(b)</span> False
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    ))}
                </div>

                {/* Footer Metadata */}
                <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-500 print:text-black">
                    <p>*** END OF QUESTION PAPER ***</p>
                    <p className="mt-2 text-[10px] print:hidden">
                        Created by: {paper.teacher?.name} | Paper ID: {paper._id}
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    body {
                        background-color: white;
                    }
                    /* Hide everything except the print container */
                    body * {
                        visibility: hidden;
                    }
                    .print\\:bg-white, .print\\:bg-white * {
                        visibility: visible;
                    }
                    .print\\:bg-white {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Reset max-width to allow full printing width */
                    .max-w-\\[210mm\\] {
                        max-width: none !important;
                        width: 100% !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
