import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import FeeSettings from '../../components/fees/FeeSettings';
import StaffCategorySettings from '../../components/staff/StaffCategorySettings';
import ExamCategories from '../academics/exams/ExamCategories';
import NotificationSettings from '../../components/admin/NotificationSettings';
import { Settings, Save, AlertCircle, CheckCircle2, Bell } from 'lucide-react';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        promotionRequiresFullFee: true,
        notificationSettings: {
            feeReceipt: { email: true, whatsapp: false, sms: false },
            admissionEnquiry: { email: true, whatsapp: false, sms: false },
            summerEnquiry: { email: true, whatsapp: false, sms: false },
            attendanceReport: { email: false, whatsapp: false, sms: false },
            staffAttendanceReport: { email: false, whatsapp: false, sms: false }
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            if (data) {
                setSettings({
                    promotionRequiresFullFee: data.promotionRequiresFullFee,
                    notificationSettings: data.notificationSettings || {
                        feeReceipt: { email: true, whatsapp: false, sms: false },
                        admissionEnquiry: { email: true, whatsapp: false, sms: false },
                        summerEnquiry: { email: true, whatsapp: false, sms: false },
                        attendanceReport: { email: false, whatsapp: false, sms: false },
                        staffAttendanceReport: { email: false, whatsapp: false, sms: false }
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showMessage('error', 'Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings', settings);
            showMessage('success', 'Settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'general');

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) {
        return (
            <div className="p-6 max-w-6xl mx-auto flex justify-center items-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-slate-500" />
                    System Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage global configurations and financial definitions for the system.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-200/50 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    General Settings
                </button>
                <button
                    onClick={() => setActiveTab('fees')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'fees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Fee Configuration
                </button>
                <button
                    onClick={() => setActiveTab('staffCategories')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'staffCategories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Staff Categories
                </button>
                <button
                    onClick={() => setActiveTab('examCategories')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'examCategories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Exam Categories
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Notification Settings
                </button>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium text-sm">{message.text}</span>
                </div>
            )}

            {activeTab === 'general' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Academic & Promotion Settings</h2>

                        <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <h3 className="font-medium text-slate-800">Require Full Fee Clearance for Promotion</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                                    If enabled, students with any pending fee balance for the current academic year will be blocked from being promoted to the next class during the bulk promotion wizard. They will be marked as "On Hold". If disabled, they will be promoted, but their financial clearance will remain marked as pending.
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.promotionRequiresFullFee}
                                        onChange={(e) => setSettings({ ...settings, promotionRequiresFullFee: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={18} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            ) : activeTab === 'fees' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[600px]">
                    <FeeSettings isInline={true} />
                </div>
            ) : activeTab === 'staffCategories' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800">Staff Category Configuration</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage staff categories and subcategories used across the Staff module.</p>
                    </div>
                    <StaffCategorySettings />
                </div>
            ) : activeTab === 'examCategories' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ExamCategories />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
                    <NotificationSettings settings={settings} setSettings={setSettings} />

                    <div className="p-6 bg-slate-50 flex justify-end border-t border-slate-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={18} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
