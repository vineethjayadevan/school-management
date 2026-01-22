import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    School,
    Calendar,
    Users,
    Image as ImageIcon,
    MapPin,
    Phone,
    Mail,
    ChevronDown,
    ArrowRight,
    GraduationCap,
    Award,
    BookOpen,
    Star,
    Heart,
    Smile,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

// --- Sub-components (Internal for now, can be extracted later) ---

const Navbar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Click outside listener
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogin = (role) => {
        // You might want to pass state to pre-fill or set context, 
        // but for now simple navigation to the shared login page is sufficient.
        navigate('/login');
        setIsDropdownOpen(false);
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="/images/logo.jpeg" alt="Logo" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                    <span className={`text-2xl md:text-3xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                        Stem Global Public School
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {['About', 'Events', 'Gallery', 'Board', 'Contact'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={`text-sm font-medium hover:text-indigo-500 transition-colors ${scrolled ? 'text-slate-600' : 'text-white/90'}`}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                    >
                        Login Portal
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                            >
                                <div className="p-1">
                                    <button onClick={() => handleLogin('admin')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" /> Admin
                                    </button>
                                    <button onClick={() => handleLogin('teacher')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" /> Teacher
                                    </button>
                                    <button onClick={() => handleLogin('student')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Student
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const { addToast } = useToast();
    const [enquiryForm, setEnquiryForm] = useState({
        name: '',
        studentName: '',
        studentGrade: '',
        contactNumber: '',
        email: '',
        message: ''
    });

    const handleEnquirySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/enquiries', enquiryForm);
            addToast('Enquiry submitted successfully! We will contact you soon.', 'success');
            setIsEnquiryOpen(false);
            setEnquiryForm({
                name: '',
                studentName: '',
                studentGrade: '',
                contactNumber: '',
                email: '',
                message: ''
            });
        } catch (error) {
            addToast('Failed to submit enquiry. Please try again.', 'error');
        }
    };

    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Abstract Modern Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-[20%] w-[70vw] h-[70vw] bg-pink-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-white text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium mb-8 border border-white/20">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span>Modern Montessori & International Education</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8 tracking-tight">
                        Start Their Journey <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                            With Excellence
                        </span>
                    </h1>

                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        A nurturing environment where little minds grow, explore, and discover the joy of learning. Building strong foundations for a bright future.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => setIsEnquiryOpen(true)}
                            className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2"
                        >
                            Enquire Now <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => setIsContactOpen(true)}
                            className="px-8 py-4 bg-transparent border-2 border-white/30 hover:bg-white/10 rounded-full font-bold text-lg text-white transition-all backdrop-blur-sm"
                        >
                            Schedule a Visit
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Contact Modal */}
            <AnimatePresence>
                {isContactOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsContactOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 text-center"
                        >
                            <button
                                onClick={() => setIsContactOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Phone size={32} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Contact Admissions</h3>
                            <p className="text-slate-500 mb-8">Please reach out to us on the numbers below for inquiries and appointments.</p>

                            <div className="space-y-4">
                                <a href="tel:+919746402501" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
                                    <span className="font-bold text-lg group-hover:text-indigo-700">+91 9746402501</span>
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600">
                                        <Phone size={16} />
                                    </div>
                                </a>
                                <a href="tel:+919544547511" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
                                    <span className="font-bold text-lg group-hover:text-indigo-700">+91 9544547511</span>
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600">
                                        <Phone size={16} />
                                    </div>
                                </a>
                            </div>

                            <button
                                onClick={() => setIsContactOpen(false)}
                                className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Enquiry Modal */}
            <AnimatePresence>
                {isEnquiryOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEnquiryOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 p-8"
                        >
                            <button
                                onClick={() => setIsEnquiryOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Admission Enquiry</h3>

                            <form onSubmit={handleEnquirySubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={enquiryForm.name}
                                            onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input
                                            required
                                            type="tel"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={enquiryForm.contactNumber}
                                            onChange={(e) => setEnquiryForm({ ...enquiryForm, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={enquiryForm.studentName}
                                            onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Grade Applying</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={enquiryForm.studentGrade}
                                            onChange={(e) => setEnquiryForm({ ...enquiryForm, studentGrade: e.target.value })}
                                        >
                                            <option value="">Select Grade</option>
                                            <option value="Playgroup">Playgroup</option>
                                            <option value="LKG">LKG</option>
                                            <option value="UKG">UKG</option>
                                            <option value="Class 1">Class 1</option>
                                            <option value="Class 2">Class 2</option>
                                            <option value="Class 3">Class 3</option>
                                            <option value="Class 4">Class 4</option>
                                            <option value="Class 5">Class 5</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={enquiryForm.email}
                                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message / Questions</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={enquiryForm.message}
                                        onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Submit Enquiry
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </section>
    );
};

const About = () => (
    <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-orange-400 to-pink-400 rounded-3xl opacity-20 blur-xl" />
                    <img
                        src="https://images.unsplash.com/photo-1587652990173-fed52288a846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Montessori Classroom"
                        className="relative rounded-2xl shadow-2xl w-full object-cover h-[500px]"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl max-w-xs hidden md:block border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Smile size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">Happy Kids</div>
                                <div className="text-sm text-slate-500">Love Learning</div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">Our play-based approach ensures every child loves coming to school.</p>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wide uppercase text-sm mb-3">
                        <span className="w-8 h-[2px] bg-indigo-600"></span>
                        About Us
                    </div>
                    <h3 className="text-4xl font-bold text-slate-900 mb-6">Foundations for Life</h3>
                    <p className="text-slate-600 leading-relaxed mb-6 text-lg">
                        At Stem Global Public School, we follow the Montessori philosophy, fostering independence and a love for learning from the very start. Our environment is designed to stimulate curiosity and creativity in young minds.
                    </p>
                    <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                        We blend traditional values with modern teaching methodologies to create a holistic learning experience for students from Montessori to Grade 5.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        {[
                            { icon: Star, title: 'Play-Based Learning', desc: 'Engaging activities', color: 'text-yellow-500 bg-yellow-50' },
                            { icon: Heart, title: 'Emotional Growth', desc: 'Nurturing care', color: 'text-pink-500 bg-pink-50' },
                            { icon: Users, title: 'Safe Environment', desc: 'Secure campus', color: 'text-green-500 bg-green-50' },
                            { icon: Award, title: 'Skill Development', desc: 'Holistic growth', color: 'text-indigo-500 bg-indigo-50' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Events = () => {
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await api.get('/events');
                setEvents(data);
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <section id="events" className="py-24 bg-slate-50 relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Upcoming Events</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">Mark your calendars! Be part of our vibrant school community celebrations.</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-slate-100 flex flex-col md:flex-row items-center gap-8 group"
                        >
                            <div className={`w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br ${event.color} flex flex-col items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform`}>
                                <span className="text-6xl font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
                                <span className="text-xl font-medium uppercase tracking-wider">{event.date.split(' ')[0]}</span>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                <p className="text-slate-600 text-lg leading-relaxed mb-6">{event.desc}</p>
                                <div className="inline-flex items-center text-indigo-600 font-bold group-hover:gap-2 transition-all">
                                    View Details <ArrowRight size={20} className="ml-2" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Event Details Popup */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10"
                        >
                            <div className={`h-32 bg-gradient-to-r ${selectedEvent.color} relative`}>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="flex items-center gap-3 text-indigo-600 font-semibold mb-4">
                                    <Calendar size={20} />
                                    {selectedEvent.date}
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">{selectedEvent.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {selectedEvent.details || "Details coming soon..."}
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

const Gallery = () => (
    <section id="gallery" className="py-24 bg-white">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Little Moments</h2>
                    <p className="text-slate-600 text-lg">Capturing the joy and wonder of our students' daily journey.</p>
                </div>
                <button className="hidden md:flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all px-6 py-3 bg-indigo-50 rounded-full hover:bg-indigo-100">
                    View All Photos <ArrowRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
                {/* Main Large Image */}
                <div className="col-span-2 row-span-2 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Kids Playing" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                        <span className="text-white font-bold text-xl">Joyful Playtime</span>
                    </div>
                </div>

                {/* Smaller Images */}
                <div className="col-span-1 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1596464716127-f9a804e0647e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Art Class" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="col-span-1 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Reading Time" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="col-span-1 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Group Activity" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="col-span-1 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1571260899304-42d98b60d713?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Learning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>
            <button className="md:hidden w-full mt-6 flex items-center justify-center gap-2 text-indigo-600 font-bold px-6 py-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                View All Photos <ArrowRight size={20} />
            </button>
        </div>
    </section>
);

const Board = () => (
    <section id="board" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Our Leadership</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">Guided by a vision to empower the next generation.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
                {[
                    { name: "Dr. James Wilson", role: "Chairman", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" },
                    { name: "Sarah Margaret", role: "Principal", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" },
                    { name: "Robert Cheney", role: "Director of Academics", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" }
                ].map((person, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all text-center group border border-slate-100">
                        <div className="relative mb-6 mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-indigo-100 rounded-full transform rotate-6 group-hover:rotate-12 transition-transform"></div>
                            <img src={person.img} alt={person.name} className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h3>
                        <p className="text-indigo-600 font-medium mb-4">{person.role}</p>
                        <p className="text-slate-500 text-sm leading-relaxed">Dedicated to fostering an environment of academic excellence and integrity.</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer id="contact" className="bg-slate-900 text-slate-300 py-20 border-t border-slate-800">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                            <School size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">Stem Global Public School</span>
                    </div>
                    <p className="text-slate-400 mb-8 max-w-md text-lg leading-relaxed">
                        Nurturing curiosity today, creating leaders for tomorrow. Where learning is a joyful adventure.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons Placeholders */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer text-white">
                                <Users size={20} />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-8 text-lg">Quick Links</h4>
                    <ul className="space-y-4">
                        {['About Us', 'Admissions', 'Academics', 'Events', 'Contact'].map(item => (
                            <li key={item}><a href={`#${item.toLowerCase()}`} className="hover:text-indigo-400 transition-colors block py-1">{item}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-8 text-lg">Contact Us</h4>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
                                <MapPin size={20} />
                            </div>
                            <span>Eravakkad (po) , kollannoor, kappoor panchayat PIN: 679552</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
                                <Phone size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span>+91 9746402501</span>
                                <span>+91 9544547511</span>
                            </div>
                        </li>
                        <li className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
                                <Mail size={20} />
                            </div>
                            <span>info@stemglobal.edu</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                <div>&copy; 2025 Stem Global Public School. All rights reserved.</div>
                <div className="flex gap-8 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
);

export default function Home() {
    return (
        <div className="min-h-screen font-sans">
            <Navbar />
            <Hero />
            <About />
            <Events />
            <Gallery />
            <Board />
            <Footer />
        </div>
    );
}
