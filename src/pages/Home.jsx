import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    School,
    Calendar,
    Users,
    MapPin,
    Phone,
    Mail,
    ChevronDown,
    ArrowRight,
    Award,
    BookOpen,
    Star,
    Heart,
    Smile,
    X,
    CheckCircle,
    Play,
    Check,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

// --- Shared Components ---

const SectionHeader = ({ title, subtitle, centered = true }) => (
    <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
        >
            {title}
        </motion.h2>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-slate-500 text-lg md:text-xl leading-relaxed max-w-2xl ${centered ? 'mx-auto' : ''}`}
        >
            {subtitle}
        </motion.p>
    </div>
);

// --- Sub-components ---

const Navbar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const dropdownRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            // Active section logic
            const sections = ['home', 'about', 'admissions', 'campustour', 'events', 'gallery', 'board', 'contact'];
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top >= -100 && rect.top < window.innerHeight / 2;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };
        window.addEventListener('scroll', handleScroll);

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
        navigate('/login');
        setIsDropdownOpen(false);
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                        S
                    </div>
                    <span className={`text-xl md:text-2xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                        Stem Global
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {['Home', 'About', 'Admissions', 'Campus Tour', 'Events', 'Gallery', 'Board', 'Contact'].map((item) => {
                        const sectionId = item.toLowerCase().replace(' ', '');
                        return (
                            <a
                                key={item}
                                href={`#${sectionId}`}
                                className={`text-sm font-medium transition-colors relative group ${activeSection === sectionId ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                            >
                                {item}
                                <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 transition-all ${activeSection === sectionId ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </a>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    {/* Login Portal Dropdown - Hidden on very small screens if needed, but keeping generally accessible */}
                    <div className="relative hidden md:block" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 text-sm shadow-xl shadow-slate-200"
                        >
                            Login Portal
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-1"
                                >
                                    {['Admin', 'Teacher', 'Student'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => handleLogin(role.toLowerCase())}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3 font-medium"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${role === 'Admin' ? 'bg-red-500' : role === 'Teacher' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            {role}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-slate-900 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
                    >
                        <div className="flex flex-col p-6 space-y-4">
                            {['Home', 'About', 'Admissions', 'Campus Tour', 'Events', 'Gallery', 'Board', 'Contact'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(' ', '')}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2"
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Login Portals</p>
                                <div className="space-y-2">
                                    {['Admin', 'Teacher', 'Student'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => handleLogin(role.toLowerCase())}
                                            className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-3"
                                        >
                                            <div className={`w-2 h-2 rounded-full ${role === 'Admin' ? 'bg-red-500' : role === 'Teacher' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            {role} Login
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

const Hero = ({ onRegister, onContact }) => {
    return (
        <section id="home" className="relative min-h-screen flex items-center pt-20 bg-slate-50 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 rounded-l-[100px] transform translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-50/50 rounded-tr-[100px] transform -translate-x-10"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.button
                            onClick={onContact}
                            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 rgba(99, 102, 241, 0)", "0 0 20px rgba(99, 102, 241, 0.5)", "0 0 0 rgba(99, 102, 241, 0)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold mb-8 tracking-wide cursor-pointer hover:bg-indigo-700 transition-colors"
                        >
                            ✨ 2025-26 ADMISSIONS OPEN - CLICK HERE
                        </motion.button>

                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                            Nurturing <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                                Global Leaders
                            </span>
                        </h1>
                        <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                            We provide a holistic education that balances academic excellence with character development, preparing students for a limitless future.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={onRegister}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 group"
                            >
                                Register Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
                                <Play size={18} className="fill-slate-700" /> Watch Video
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                            <img
                                src="/images/hero.jpeg"
                                alt="Student Learning"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-2xl z-0"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full opacity-10 blur-3xl z-0"></div>

                        {/* Floating Stats */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="absolute bottom-8 -left-8 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 z-20 border border-slate-50 hidden md:block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <Smile size={24} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">100%</div>
                                    <div className="text-sm text-slate-500 font-medium">Happy Students</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};



const About = () => {
    const features = [
        { icon: Star, title: 'Montessori Method', desc: 'Fostering independence and natural curiosity.' },
        { icon: Heart, title: 'Holistic Growth', desc: 'Focusing on emotional and social development.' },
        { icon: Users, title: 'Expert Faculty', desc: 'Dedicated mentors guiding every step.' },
        { icon: Award, title: 'Modern Facilities', desc: 'Safe, stimulating environments for learning.' }
    ];

    return (
        <section id="about" className="py-32 bg-white">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6"
                        >
                            About Us
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight"
                        >
                            Building Strong Foundations for Life
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 text-lg leading-relaxed mb-6"
                        >
                            At Stem Global Public School, we believe that education is not just about filling a bucket, but lighting a fire. Our approach blends traditional values with modern methodologies.
                        </motion.p>

                        <div className="grid sm:grid-cols-2 gap-8 mt-12">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    className="flex flex-col gap-3"
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 mb-2">
                                        <feature.icon size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900">{feature.title}</h4>
                                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Kids" className="rounded-3xl w-full h-64 object-cover translate-y-12 shadow-xl" />
                            <img src="https://images.unsplash.com/photo-1587652990173-fed52288a846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Classroom" className="rounded-3xl w-full h-64 object-cover shadow-xl" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Events = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/events').then(({ data }) => setEvents(data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    // Placeholder events if API fails or empty
    const displayEvents = events.length > 0 ? events : [
        { id: 1, title: 'Annual Sports Day', date: 'DEC 15', desc: 'A day of fun, games, and healthy competition.', color: 'from-blue-400 to-indigo-500' },
        { id: 2, title: 'Science Exhibition', date: 'JAN 20', desc: 'Showcasing the innovative projects of our young minds.', color: 'from-purple-400 to-pink-500' },
        { id: 3, title: 'Art & Craft Fair', date: 'FEB 10', desc: 'Celebrating creativity and artistic expression.', color: 'from-orange-400 to-red-500' },
    ];

    return (
        <section id="events" className="py-32 bg-slate-50">
            <div className="container mx-auto px-6">
                <SectionHeader title="Life at Campus" subtitle="Beyond textbooks, we create experiences that shape character and build community." />

                <div className="grid md:grid-cols-3 gap-8">
                    {displayEvents.map((event, idx) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-3xl p-2 shadow-lg hover:shadow-2xl transition-all group overflow-hidden"
                        >
                            <div className={`h-48 rounded-2xl bg-gradient-to-br ${event.color || 'from-indigo-500 to-purple-600'} flex flex-col items-center justify-center text-white relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                <span className="text-5xl font-bold mb-1">{event.date.split(' ')[1]}</span>
                                <span className="text-sm font-bold tracking-widest uppercase opacity-80">{event.date.split(' ')[0]}</span>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                <p className="text-slate-500 leading-relaxed mb-6">{event.desc}</p>
                                <button className="text-sm font-bold text-slate-900 flex items-center gap-2 group/btn">
                                    Learn More <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CampusTour = () => (
    <section id="campustour" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
            <SectionHeader title="Experience Our Campus" subtitle="Take a virtual tour of our world-class facilities designed to inspire learning." centered={true} />

            <div className="mt-12 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-800 aspect-video group cursor-pointer">
                <img src="/images/hero.jpeg" alt="Campus Tour" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/20">
                        <Play size={32} className="fill-white text-white ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-2xl font-bold text-white mb-2">Virtual Walkthrough</h3>
                    <p className="text-slate-300">Explore our classrooms, labs, library, and sports complex.</p>
                </div>
            </div>
        </div>
    </section>
);

const Admissions = () => (
    <section id="admissions" className="py-32 bg-indigo-600 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto"
            >
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Join Our Family</h2>
                <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
                    Admissions are open for the 2025-26 academic year. Give your child the gift of world-class education.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                    {[
                        { title: "Inquire", desc: "Submit the online inquiry form to get started." },
                        { title: "Visit", desc: "Schedule a campus visit and meet our faculty." },
                        { title: "Enroll", desc: "Complete the admission process and secure your seat." }
                    ].map((step, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                            <div className="text-3xl font-bold text-indigo-300 mb-2">0{idx + 1}</div>
                            <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                            <p className="text-indigo-100/80">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="px-10 py-5 inline-block bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl shadow-indigo-900/20 cursor-pointer">
                    Apply for Admission
                </div>
            </motion.div>
        </div>
    </section>
);

const Gallery = () => (
    <section id="gallery" className="py-32 bg-white">
        <div className="container mx-auto px-6">
            <SectionHeader title="Captured Moments" subtitle="Glimpses of joy, learning, and discovery from our daily campus life." />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[250px]">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="col-span-2 row-span-2 rounded-3xl overflow-hidden relative group">
                    <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </motion.div>
                {[
                    "https://images.unsplash.com/photo-1596464716127-f9a804e0647e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1571260899304-42d98b60d713?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                ].map((src, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 * idx }} className="col-span-1 rounded-3xl overflow-hidden relative group">
                        <img src={src} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-12">
                <button className="px-8 py-3 bg-slate-50 text-slate-900 rounded-full font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2">
                    View Full Gallery <ArrowRight size={18} />
                </button>
            </div>
        </div>
    </section>
);

const Board = () => (
    <section id="board" className="py-32 bg-slate-50">
        <div className="container mx-auto px-6">
            <SectionHeader title="Visionary Leadership" subtitle="Guided by experienced educators committed to excellence." />

            <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
                {Array.from({ length: 10 }).map((_, i) => ({
                    name: `Board Member ${i + 1}`,
                    role: "Board Member",
                    img: "https://images.unsplash.com/photo-1556157382-97eda2d622ca?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80"
                })).map((person, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                        className="bg-white p-8 rounded-3xl text-center shadow-lg border border-slate-100/50"
                    >
                        <img src={person.img} alt={person.name} className="w-24 h-24 rounded-full mx-auto mb-6 object-cover bg-slate-100" />
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h3>
                        <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide mb-4">{person.role}</p>
                        <p className="text-slate-500 text-sm leading-relaxed">Dedicated to fostering an environment of academic excellence and integrity.</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const AdmissionsNew = ({ onRegister }) => (
    <section id="admissions" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm mb-4">Admissions Open</span>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Join Our Family</h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                    We welcome students who are curious, creative, and eager to learn. Our admission process is designed to be simple and transparent.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Contact Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-slate-50 rounded-3xl p-8 border border-slate-100"
                >
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                        <Phone size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Speak to Us</h3>
                    <p className="text-slate-500 mb-8 text-sm">Our admissions team is here to answer your queries.</p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Primary</p>
                                <a href="tel:+919746402501" className="text-lg font-bold text-slate-900 hover:text-indigo-600">+91 9746402501</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Secondary</p>
                                <a href="tel:+919544547511" className="text-lg font-bold text-slate-900 hover:text-indigo-600">+91 9544547511</a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Procedure & Fees Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-8"
                >
                    {/* Procedure */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <CheckCircle className="text-indigo-600" size={24} /> Admission Procedure
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { step: "01", title: "Registration", desc: "Submit the online inquiry form or visit the school office." },
                                { step: "02", title: "Interaction", desc: "Student interaction and document verification." },
                                { step: "03", title: "Enrollment", desc: "Payment of fees and confirmation of admission." }
                            ].map((item, i) => (
                                <div key={i} className="relative">
                                    <div className="text-4xl font-bold text-slate-100 mb-2">{item.step}</div>
                                    <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fees & CTA */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Fee Structure</h3>
                                <p className="text-indigo-100 mb-6 text-sm">Transparent and affordable fee structure for all grades.</p>
                                <button className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                    <BookOpen size={16} /> Download Brochure
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center items-start">
                            <h3 className="text-2xl font-bold mb-2">Ready to Apply?</h3>
                            <button
                                onClick={onRegister}
                                className="mt-auto px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 w-full justify-center"
                            >
                                Register Now <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer id="contact" className="bg-slate-900 text-slate-300 py-24">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            S
                        </div>
                        <span className="text-2xl font-bold text-white">Stem Global</span>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-8">
                        Nurturing curiosity today, creating leaders for tomorrow. Where learning is a joyful adventure.
                    </p>
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer text-white">
                                <Users size={18} />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
                    <ul className="space-y-4">
                        {['About Us', 'Admissions', 'Academics', 'Events', 'Contact'].map(item => (
                            <li key={item}><a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors block">{item}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-lg">Contact</h4>
                    <ul className="space-y-4 text-slate-400">
                        <li className="flex gap-3"><MapPin size={20} className="shrink-0 text-indigo-400" /> Eravakkad, Kollannoor<br />Kerala, 679552</li>
                        <li className="flex gap-3"><Phone size={20} className="shrink-0 text-indigo-400" /> +91 9746402501</li>
                        <li className="flex gap-3"><Mail size={20} className="shrink-0 text-indigo-400" /> info@stemglobal.edu</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                <p>&copy; 2025 Stem Global Public School. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white">Privacy</a>
                    <a href="#" className="hover:text-white">Terms</a>
                </div>
            </div>
        </div>
    </footer>
);

export default function Home() {
    const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
    const [isAdmissionsContactOpen, setIsAdmissionsContactOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const { addToast } = useToast();

    // Initial State matching new schema
    const initialFormState = {
        studentFirstName: '',
        studentMiddleName: '',
        studentLastName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        studentGrade: '',
        contactNumber: '',
        email: '',
        message: ''
    };

    const [enquiryForm, setEnquiryForm] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEnquirySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/enquiries', enquiryForm);
            setIsEnquiryOpen(false);
            setIsSuccessOpen(true);
            setEnquiryForm(initialFormState);
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to submit registration.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEnquiryForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar />
            <Hero onRegister={() => setIsEnquiryOpen(true)} onContact={() => setIsAdmissionsContactOpen(true)} />
            <About />
            <AdmissionsNew onRegister={() => setIsEnquiryOpen(true)} />
            <CampusTour />
            <Events />
            <Gallery />
            <Board />
            <Footer />

            {/* Global Modals lifted to Home */}

            {/* Admissions Contact Modal */}
            <AnimatePresence>
                {isAdmissionsContactOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdmissionsContactOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-20 p-8 text-center"
                        >
                            <button
                                onClick={() => setIsAdmissionsContactOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Phone size={32} />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Admissions Contact</h3>
                            <p className="text-slate-500 mb-8">Call us directly to secure your seat for the 2025-26 academic year.</p>

                            <div className="space-y-4">
                                <a href="tel:+919746402501" className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                    <div className="text-left">
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Primary Contact</div>
                                        <div className="font-bold text-xl">+91 9746402501</div>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                                        <Phone size={20} />
                                    </div>
                                </a>
                                <a href="tel:+919544547511" className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                    <div className="text-left">
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Secondary Contact</div>
                                        <div className="font-bold text-xl">+91 9544547511</div>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                                        <Phone size={20} />
                                    </div>
                                </a>
                            </div>

                            <button
                                onClick={() => setIsAdmissionsContactOpen(false)}
                                className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Enquiry/Register Modal */}
            <AnimatePresence>
                {isEnquiryOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEnquiryOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-20 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">Student Registration</h3>
                                        <p className="text-slate-500 text-sm mt-1">Fill in the details below to register.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEnquiryOpen(false)}
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Contact Info Banner */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 text-indigo-700">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Admissions Help</p>
                                            <p className="font-semibold text-sm">+91 9746402501 / +91 9544547511</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleEnquirySubmit} className="space-y-5">
                                    {/* Student Name Section */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            <Users size={16} /> Student Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">First Name *</label>
                                                <input required name="studentFirstName" placeholder="First Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.studentFirstName} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Middle Name</label>
                                                <input name="studentMiddleName" placeholder="Middle Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.studentMiddleName} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Last Name *</label>
                                                <input required name="studentLastName" placeholder="Last Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.studentLastName} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Date of Birth *</label>
                                                <input required type="date" name="dob" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.dob} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Grade Sought *</label>
                                                <select required name="studentGrade" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.studentGrade} onChange={handleChange}>
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
                                    </div>

                                    {/* Parents Section */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            <Users size={16} /> Parent Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Father's Name *</label>
                                                <input required name="fatherName" placeholder="Father's Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.fatherName} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Mother's Name *</label>
                                                <input required name="motherName" placeholder="Mother's Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.motherName} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Section */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            <Phone size={16} /> Contact Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number *</label>
                                                <input required name="contactNumber" placeholder="Mobile Number" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.contactNumber} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email (Optional)</label>
                                                <input type="email" name="email" placeholder="example@email.com" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={enquiryForm.email} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Remarks / Enquiry</label>
                                        <textarea rows="3" name="message" placeholder="Any specific questions or remarks?" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" value={enquiryForm.message} onChange={handleChange}></textarea>
                                    </div>

                                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex justify-center items-center gap-2">
                                        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {isSuccessOpen && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-20 p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={40} strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h3>
                            <p className="text-slate-500 mb-8">
                                Your application has been sent to our office. We will contact you shortly regarding the next steps.
                            </p>
                            <button
                                onClick={() => setIsSuccessOpen(false)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Done
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
