import React from 'react';
import { Mail, MessageCircle, Smartphone, AlertCircle } from 'lucide-react';

const NotificationSettings = ({ settings, setSettings }) => {
    const notificationTypes = [
        { id: 'feeReceipt', label: 'Fee Receipt', description: 'Sent when a fee payment is successfully recorded.' },
        { id: 'admissionEnquiry', label: 'Admission Enquiry', description: 'Sent when a new admission enquiry is submitted.' },
        { id: 'summerEnquiry', label: 'Summer Enquiry', description: 'Sent when a summer vacation enquiry is submitted.' },
        { id: 'attendanceReport', label: 'Student Attendance', description: 'Sent when a student is marked as absent or late.' },
        { id: 'staffAttendanceReport', label: 'Staff Attendance', description: 'Sent when staff is marked as absent or late.' },
    ];

    const channels = [
        { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', active: true },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600', active: true },
        { id: 'sms', label: 'SMS', icon: Smartphone, color: 'text-amber-600', active: true },
    ];

    const handleToggle = (typeId, channelId) => {
        setSettings({
            ...settings,
            notificationSettings: {
                ...settings.notificationSettings,
                [typeId]: {
                    ...settings.notificationSettings[typeId],
                    [channelId]: !settings.notificationSettings[typeId][channelId]
                }
            }
        });
    };

    if (!settings.notificationSettings) return null;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Notification Channels</h2>
                    <p className="text-sm text-slate-500 mt-1">Configure which events trigger notifications across different platforms.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Name</th>
                            {channels.map(channel => (
                                <th key={channel.id} className="text-center py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center gap-1">
                                        <channel.icon size={18} className={channel.color} />
                                        <span>{channel.label}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {notificationTypes.map(type => (
                            <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-5 px-4">
                                    <h4 className="font-semibold text-slate-800">{type.label}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                                </td>
                                {channels.map(channel => (
                                    <td key={channel.id} className="py-5 px-4 text-center">
                                        <label className={`relative inline-flex items-center ${channel.active ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.notificationSettings[type.id]?.[channel.id] || false}
                                                onChange={() => channel.active && handleToggle(type.id, channel.id)}
                                                disabled={!channel.active}
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-900 mb-1">How it works</h4>
                <ul className="text-xs text-indigo-700 space-y-2 list-disc ml-4">
                    <li>Notifications are triggered automatically by the system when the corresponding event occurs.</li>
                    <li>Email notifications require a valid <strong>Resend API Key</strong>.</li>
                    <li>WhatsApp and SMS channels require valid <strong>MSG91 API credentials</strong> and approved templates initialized in your server variables.</li>
                    <li>Toggle switches to enable or disable specific notifications for each channel.</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationSettings;
