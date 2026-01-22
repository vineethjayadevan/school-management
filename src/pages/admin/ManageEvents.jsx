import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Filter,
    MoreVertical,
    Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../services/api'; // Assuming you have an api service configured
import { useToast } from '../../components/ui/Toast';

export default function ManageEvents() {
    const [events, setEvents] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingEvent, setEditingEvent] = useState(null);
    const { addToast } = useToast();

    // Fetch Events
    const fetchEvents = async () => {
        try {
            const { data } = await api.get('/events');
            setEvents(data);
        } catch (error) {
            addToast('Failed to fetch events', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Form Handling
    const { register, handleSubmit, reset, setValue } = useForm();

    const onSubmit = async (data) => {
        try {
            if (editingEvent) {
                await api.put(`/events/${editingEvent._id}`, data);
                addToast('Event updated successfully', 'success');
            } else {
                await api.post('/events', data);
                addToast('Event created successfully', 'success');
            }
            fetchEvents();
            handleCloseModal();
        } catch (error) {
            addToast(editingEvent ? 'Failed to update event' : 'Failed to create event', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                addToast('Event deleted successfully', 'success');
                // Optimistic update or refetch
                setEvents(events.filter(e => e._id !== id));
            } catch (error) {
                addToast('Failed to delete event', 'error');
            }
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setValue('title', event.title);
        setValue('date', event.date);
        setValue('desc', event.desc);
        setValue('details', event.details);
        setValue('color', event.color);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingEvent(null);
        reset();
    };

    const gradients = [
        { label: 'Blue - Cyan', value: 'from-blue-500 to-cyan-500' },
        { label: 'Purple - Pink', value: 'from-purple-500 to-pink-500' },
        { label: 'Orange - Red', value: 'from-orange-500 to-red-500' },
        { label: 'Green - Emerald', value: 'from-green-500 to-emerald-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Events</h1>
                    <p className="text-slate-500">Create and manage upcoming school events</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Event</span>
                </button>
            </div>

            {/* Event List */}
            {isLoading ? (
                <div className="text-center py-10">Loading events...</div>
            ) : events.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No events found</h3>
                    <p className="text-slate-500 mb-6">Get started by creating a new event.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                            <div className={`h-24 bg-gradient-to-r ${event.color} p-6 flex justify-between items-start text-white`}>
                                <div className="font-bold text-2xl">{event.date.split(' ')[0]}</div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(event)} className="p-1 hover:bg-white/20 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(event._id)} className="p-1 hover:bg-white/20 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.desc}</p>
                                <div className="text-xs text-slate-400">Created: {new Date(event.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                                <input
                                    {...register('title', { required: true })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Annual Sports Day"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date (Display)</label>
                                    <input
                                        {...register('date', { required: true })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Jan 26, 2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Color Theme</label>
                                    <select
                                        {...register('color')}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {gradients.map(g => (
                                            <option key={g.value} value={g.value}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                                <textarea
                                    {...register('desc', { required: true })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    rows="2"
                                    placeholder="Brief summary for the card..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Details</label>
                                <textarea
                                    {...register('details')}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    rows="4"
                                    placeholder="Detailed information for the popup..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                                >
                                    {editingEvent ? 'Save Changes' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
