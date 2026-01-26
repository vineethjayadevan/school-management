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
    Menu,
    Download,
    FileText
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
                    <img
                        src="/images/logo.png"
                        alt="Stem Global Logo"
                        className="h-12 w-auto object-contain rounded-lg"
                    />
                    <div className="flex flex-col">
                        <span className={`text-xl md:text-2xl font-bold tracking-tight leading-none ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                            Stem Global Public School
                        </span>
                        <span className="text-xs md:text-sm font-medium text-slate-500 tracking-wide">
                            Kollannoor-Kappur Palakkad District Kerala
                        </span>
                    </div>
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

// Skip to Hero section replacement for the button
const Hero = ({ onRegister, onContact, onViewFees }) => {
    return (
        <section id="home" className="relative min-h-screen flex items-center pt-28 bg-slate-50 overflow-hidden">
            {/* Background shapes */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 rounded-l-[100px] transform translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-50/50 rounded-tr-[100px] transform -translate-x-10"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Image Column - Left */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative order-1" // Ensure visual order matches logical order if needed, but grid default is fine
                    >
                        <div className="aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                            <img
                                src="/images/abtUs2.jpeg"
                                alt="Student Learning"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-2xl z-0"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full opacity-10 blur-3xl z-0"></div>


                    </motion.div>

                    {/* Text Column - Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="order-2"
                    >
                        <motion.button
                            onClick={onContact}
                            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 rgba(99, 102, 241, 0)", "0 0 20px rgba(99, 102, 241, 0.5)", "0 0 0 rgba(99, 102, 241, 0)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold mb-8 tracking-wide cursor-pointer hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            ✨ 2025-26 ADMISSIONS OPEN - CLICK HERE
                        </motion.button>

                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight drop-shadow-sm">
                            Inspiring Minds <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-600">
                                Igniting Innovation
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
                            Dream Big, Reach Closer, Rise with STEM Global Public School
                        </p>
                        <div className="flex flex-wrap gap-4 mb-2">
                            <button
                                onClick={onRegister}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 group"
                            >
                                Register Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a
                                href="/documents/school-brochure.pdf"
                                download="STEM_Global_Brochure.pdf"
                                className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Download size={18} className="text-slate-700" /> Download Brochure
                            </a>
                        </div>

                        {/* Catchy Scanner Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Connect With Us</span>
                                <div className="h-px bg-slate-200 flex-grow"></div>
                            </div>

                            <div className="inline-flex gap-4 bg-white/80 p-3 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-900/5">
                                {/* Location Scanner */}
                                <div className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-indigo-50/50 p-2 rounded-xl transition-colors">
                                    <div className="w-20 h-20 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                                        <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center">
                                            <MapPin size={28} className="text-indigo-400" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                        📍 Locate Us
                                    </span>
                                </div>

                                <div className="w-px bg-slate-200 my-2"></div>

                                {/* Instagram Scanner */}
                                <a
                                    href="https://www.instagram.com/stemglobalpublicschool"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-pink-50/50 p-2 rounded-xl transition-colors"
                                >
                                    <div className="w-20 h-20 bg-white rounded-xl p-1 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                                        <img
                                            src="/images/insta-scanner.jpg.jpeg"
                                            alt="Instagram"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                        📸 Follow Us
                                    </span>
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};



const About = () => {
    return (
        <section id="about" className="py-32 bg-white">
            <div className="container mx-auto px-6">
                {/* 1. Who We Are - Full Width Top Section */}
                <div className="mb-16 text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6"
                    >
                        About Us
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight"
                    >
                        Who We Are
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 text-lg leading-relaxed"
                    >
                        STEM Global Public School is an initiative of STEM GPS Educational & Charitable Trust, committed to nurturing future-ready learners through a blend of Montessori philosophy, STEM-based learning, and NEP-supported CBSE education.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    {/* 2. Left Column - Motto & Educational Approach */}
                    <div>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Motto</h3>
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl"
                                    >
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <Star size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-1">Start With Montessori</h4>
                                            <p className="text-slate-500 text-sm">Pre-primary montessori to grade 3</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 }}
                                        className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-1">Rise with Stem Education</h4>
                                            <p className="text-slate-500 text-sm">Grade 4 to 8</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Educational Approach</h3>
                                <div className="space-y-4">
                                    {[
                                        { title: "Montessori Foundation (Early Years)", desc: "Child-led, activity-based learning that develops independence, concentration, and confidence.", color: "bg-orange-50 text-orange-700" },
                                        { title: "STEM-Based Learning (Primary & Middle School)", desc: "Integrating Science, Technology, Engineering, and Mathematics to enhance critical thinking, creativity, and problem-solving skills.", color: "bg-blue-50 text-blue-700" },
                                        { title: "NEP 2020 Alignment", desc: "Focus on conceptual clarity, experiential learning, competency-based assessment and holistic development.", color: "bg-green-50 text-green-700" }
                                    ].map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl border border-slate-100 ${item.color}`}>
                                            <h4 className="font-bold text-base mb-1">{item.title}</h4>
                                            <p className="text-sm opacity-90">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Right Column - Images Collage */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {/* Column 1 */}
                            <div className="space-y-4">
                                <img
                                    src="/images/aboutus/ABM04846.jpg"
                                    alt="Learning Environment"
                                    loading="lazy"
                                    className="rounded-2xl w-full h-auto shadow-lg hover:scale-105 transition-transform duration-500"
                                />
                                <img
                                    src="/images/aboutus/ABM04942.jpg"
                                    alt="Student Activities"
                                    loading="lazy"
                                    className="rounded-2xl w-full h-auto shadow-lg hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Column 2 - Offset */}
                            <div className="space-y-4 pt-20">
                                <img
                                    src="/images/aboutus/ABM05002.jpg"
                                    alt="Classroom"
                                    loading="lazy"
                                    className="rounded-2xl w-full h-auto shadow-lg hover:scale-105 transition-transform duration-500"
                                />
                                <img
                                    src="/images/aboutus/ABM04897.jpg"
                                    alt="Campus Life"
                                    loading="lazy"
                                    className="rounded-2xl w-full h-auto shadow-lg hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </motion.div>

                        {/* Decorative background elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-full blur-3xl -z-10 opacity-60"></div>
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

const CampusTour = () => {
    const campusImages = [
        "ABM04857.jpg", "ABM04870.jpg", "ABM04883.jpg", "ABM04891.jpg",
        "ABM04903.jpg", "ABM05033.jpg", "ABM05036.jpg", "ABM05217.jpg"
    ];

    return (
        <section id="campustour" className="py-32 bg-slate-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <SectionHeader title="Experience Our Campus" subtitle="A world-class environment designed to inspire learning, creativity, and growth." centered={true} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {campusImages.map((img, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            className={`relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer ${idx === 0 || idx === 7 ? 'md:col-span-2 md:row-span-2 aspect-[4/3]' : 'aspect-square'
                                }`}
                        >
                            <img
                                src={`/images/campustour/${img}`}
                                alt={`Campus Tour ${idx + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

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
                    <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Main" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </motion.div>
                {[
                    "https://images.unsplash.com/photo-1596464716127-f9a804e0647e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1571260899304-42d98b60d713?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                ].map((src, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 * idx }} className="col-span-1 rounded-3xl overflow-hidden relative group">
                        <img src={src} alt="Gallery" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-7xl mx-auto">
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
                        transition={{ delay: idx * 0.1 }}
                    >
                        <img src={person.img} alt={person.name} loading="lazy" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover bg-slate-100" />
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{person.name}</h3>
                        <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wide mb-2">{person.role}</p>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">Dedicated to fostering excellence.</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const AdmissionsNew = ({ onRegister, onViewFees }) => (
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
                                <button
                                    onClick={onViewFees}
                                    className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                >
                                    <FileText size={16} /> View Fee Structure
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
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
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
        conveyance: 'No',
        address: '',
        classMode: '',
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
            <Hero onRegister={() => {
                const element = document.getElementById('admissions');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }} onContact={() => setIsAdmissionsContactOpen(true)} />
            <About />
            <AdmissionsNew onRegister={() => setIsEnquiryOpen(true)} onViewFees={() => setIsFeeModalOpen(true)} />
            <CampusTour />
            <Events />
            <Gallery />
            <Board />
            <Footer />

            {/* Fee Structure Modal */}
            <AnimatePresence>
                {isFeeModalOpen && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFeeModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-20 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-2xl font-bold">Fee Structure 2025-26</h3>
                                    <p className="text-indigo-100 text-sm">Transparent and affordable quality education</p>
                                </div>
                                <button onClick={() => setIsFeeModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* One-time Fees */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <div className="w-2 h-8 bg-blue-500 rounded-sm"></div> One-Time Fees (New Admission)
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <span className="font-medium text-slate-600">Admission Fee</span>
                                            <span className="font-bold text-slate-900">₹ 15,000</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <span className="font-medium text-slate-600">Registration Fee</span>
                                            <span className="font-bold text-slate-900">₹ 1,000</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <span className="font-medium text-slate-600">Caution Deposit (Refundable)</span>
                                            <span className="font-bold text-slate-900">₹ 5,000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Annual Fees */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <div className="w-2 h-8 bg-green-500 rounded-sm"></div> Annual Fees
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3 text-right">Pre-Primary</th>
                                                    <th className="px-4 py-3 text-right">Primary (1-5)</th>
                                                    <th className="px-4 py-3 text-right">Middle (6-8)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-700">Annual Charges (Library, Sports, etc.)</td>
                                                    <td className="px-4 py-3 text-right">₹ 5,000</td>
                                                    <td className="px-4 py-3 text-right">₹ 6,000</td>
                                                    <td className="px-4 py-3 text-right">₹ 7,000</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-700">Development Fund</td>
                                                    <td className="px-4 py-3 text-right">₹ 2,000</td>
                                                    <td className="px-4 py-3 text-right">₹ 2,500</td>
                                                    <td className="px-4 py-3 text-right">₹ 3,000</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Tuition Fees */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <div className="w-2 h-8 bg-purple-500 rounded-sm"></div> Tuition Fees (Per Term - 3 Terms/Year)
                                    </h4>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center">
                                            <h5 className="font-bold text-indigo-900 mb-1">Pre-Primary</h5>
                                            <p className="text-3xl font-bold text-indigo-600 mb-1">₹ 8,000</p>
                                            <p className="text-xs text-indigo-500 uppercase tracking-wide">Per Term</p>
                                        </div>
                                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center">
                                            <h5 className="font-bold text-indigo-900 mb-1">Primary (1-5)</h5>
                                            <p className="text-3xl font-bold text-indigo-600 mb-1">₹ 10,000</p>
                                            <p className="text-xs text-indigo-500 uppercase tracking-wide">Per Term</p>
                                        </div>
                                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center">
                                            <h5 className="font-bold text-indigo-900 mb-1">Middle (6-8)</h5>
                                            <p className="text-3xl font-bold text-indigo-600 mb-1">₹ 12,000</p>
                                            <p className="text-xs text-indigo-500 uppercase tracking-wide">Per Term</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 border border-yellow-100">
                                    <p className="font-bold flex items-center gap-2 mb-1"><Star size={14} className="fill-yellow-600 text-yellow-600" /> Note:</p>
                                    <ul className="list-disc list-inside space-y-1 opacity-90">
                                        <li>Sibling discount of 10% on tuition fees for the second child onwards.</li>
                                        <li>Books and uniforms are charged separately based on actual usage.</li>
                                        <li>Fees once paid are non-refundable.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => {
                                        setIsFeeModalOpen(false);
                                        const element = document.getElementById('admissions');
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Apply for Admission Now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

                                    {/* Additional Details Section */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            <School size={16} /> Additional Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Class Mode *</label>
                                                <div className="flex gap-4 mt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input required type="radio" name="classMode" value="Offline" checked={enquiryForm.classMode === 'Offline'} onChange={handleChange} className="accent-indigo-600" />
                                                        <span className="text-sm text-slate-700">Offline</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input required type="radio" name="classMode" value="Online" checked={enquiryForm.classMode === 'Online'} onChange={handleChange} className="accent-indigo-600" />
                                                        <span className="text-sm text-slate-700">Online</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Conveyance Required? *</label>
                                                <div className="flex gap-4 mt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input required type="radio" name="conveyance" value="Yes" checked={enquiryForm.conveyance === 'Yes'} onChange={handleChange} className="accent-indigo-600" />
                                                        <span className="text-sm text-slate-700">Yes</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input required type="radio" name="conveyance" value="No" checked={enquiryForm.conveyance === 'No'} onChange={handleChange} className="accent-indigo-600" />
                                                        <span className="text-sm text-slate-700">No</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Field - Conditionally Mandatory */}
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 mb-1 block">
                                                Address {enquiryForm.conveyance === 'Yes' && '*'}
                                            </label>
                                            <textarea
                                                rows="2"
                                                name="address"
                                                required={enquiryForm.conveyance === 'Yes'}
                                                placeholder={enquiryForm.conveyance === 'Yes' ? "Please enter your full address for conveyance..." : "Address (Optional)"}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                value={enquiryForm.address}
                                                onChange={handleChange}
                                            ></textarea>
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
                        </motion.div >
                    </div >
                )
                }
            </AnimatePresence >

            {/* Success Modal */}
            < AnimatePresence >
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
            </AnimatePresence >
        </div >
    );
}
