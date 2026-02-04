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
    Facebook,
    Instagram,
    Download,
    FileText,
    Lock
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
    const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            // Active section logic
            const sections = ['home', 'about', 'admissions', 'campustour', 'lifeatcampus', 'events', 'gallery', 'board', 'contact'];
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
        navigate('/login', { state: { role } });
        setIsDropdownOpen(false);
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-2 md:py-3' : 'bg-transparent py-2 md:py-5'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/logo3.jpeg"
                        alt="Stem Global Logo"
                        className={`transition-all duration-500 w-auto object-contain rounded-lg shrink-0 ${scrolled ? 'h-10 md:h-11' : 'h-11 md:h-12'}`}
                    />
                    <div className="flex flex-col">
                        <span className={`text-lg md:text-xl font-bold tracking-tight leading-none ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                            STEM Global Public School
                        </span>
                        <span className="text-[10px] md:text-xs font-medium text-slate-500 tracking-wide">
                            Kollannoor-Kappur Palakkad District Kerala
                        </span>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-6 xl:gap-8">
                    {['Home', 'About', 'Admissions', 'Campus Tour', 'Life at Campus', 'Events', 'Gallery', 'Board', 'Contact'].map((item) => {
                        const sectionId = item.toLowerCase().replace(/\s+/g, '');
                        const isActive = activeSection === sectionId;
                        return (
                            <a
                                key={item}
                                href={`#${sectionId}`}
                                className={`text-sm font-semibold transition-colors relative group py-1 ${activeSection === sectionId ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                            >
                                {item}
                                <span className={`absolute -bottom-0 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${activeSection === sectionId ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </a>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    {/* Desktop Login - Small & Cute */}
                    <div className="relative hidden lg:block" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`
                                flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs transition-all duration-300 border
                                ${isDropdownOpen
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-2 ring-indigo-100'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm'
                                }
                            `}
                        >
                            <Lock size={12} className={isDropdownOpen ? 'text-indigo-500' : ''} />
                            <span>Login</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right z-50 ring-1 ring-black/5"
                                >
                                    <div className="py-1">
                                        {[
                                            { role: 'Admin', icon: '🛡️' },
                                            { role: 'Board', icon: '👑' },
                                            { role: 'Teacher', icon: '👩‍🏫' },
                                            { role: 'Student', icon: '🎓' }
                                        ].map((item) => (
                                            <button
                                                key={item.role}
                                                onClick={() => handleLogin(item.role === 'Board' ? 'board_member' : item.role.toLowerCase())}
                                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                                            >
                                                <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                                                <span className="font-medium text-slate-600 text-sm group-hover:text-indigo-600">{item.role} Login</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden text-slate-600 hover:text-indigo-600 transition-colors p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
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
                        className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-indigo-50 overflow-hidden shadow-xl"
                    >
                        <div className="flex flex-col p-6 space-y-2">
                            {['Home', 'About', 'Admissions', 'Campus Tour', 'Life at Campus', 'Events', 'Gallery', 'Board', 'Contact'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/\s+/g, '')}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-base font-bold text-slate-600 hover:text-indigo-600 py-3 border-b border-slate-50 last:border-0"
                                >
                                    {item}
                                </a>
                            ))}

                            {/* Mobile Login Dropdown Item */}
                            <div className="border-b border-slate-50 last:border-0">
                                <button
                                    onClick={() => setIsMobileLoginOpen(!isMobileLoginOpen)}
                                    className="w-full flex items-center justify-between text-base font-bold text-slate-600 hover:text-indigo-600 py-3"
                                >
                                    <span className="flex items-center gap-2"><Lock size={16} /> Login Portal</span>
                                    <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileLoginOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isMobileLoginOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-slate-50 rounded-lg mb-2"
                                        >
                                            <div className="py-2 px-2 grid grid-cols-2 gap-2">
                                                {[
                                                    { role: 'Admin', icon: '🛡️' },
                                                    { role: 'Board', icon: '👑' },
                                                    { role: 'Teacher', icon: '👩‍🏫' },
                                                    { role: 'Student', icon: '🎓' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.role}
                                                        onClick={() => handleLogin(item.role === 'Board' ? 'board_member' : item.role.toLowerCase())}
                                                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-indigo-200 transition-all text-left"
                                                    >
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className="text-xs font-bold text-slate-700">{item.role}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav >
    );
};

// Skip to Hero section replacement for the button
const Hero = ({ onRegister, onContact, onViewFees }) => {
    return (
        <section id="home" className="relative min-h-screen flex flex-col justify-center pt-28 bg-slate-50 overflow-hidden">
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
                                src="/images/abtUs2.webp"
                                alt="Student Learning"
                                className="w-full h-full object-contain md:object-cover"
                                loading="eager"
                                fetchPriority="high"
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
                            animate={{
                                scale: [1, 1.02, 1],
                                boxShadow: [
                                    "0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)",
                                    "0 20px 25px -5px rgba(79, 70, 229, 0.3), 0 10px 10px -5px rgba(79, 70, 229, 0.2)",
                                    "0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)"
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative inline-flex items-center gap-3 pr-2 pl-6 py-2 bg-indigo-600 text-white rounded-full mb-8 cursor-pointer hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-600/30 ring-4 ring-indigo-50"
                        >
                            <span className="font-bold text-sm tracking-wide text-indigo-50">✨ Admissions Open 2026-27</span>
                            <span className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                                <span className="drop-shadow-sm">100% Donation Free</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </span>
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

                        {/* Unified Info Box */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-12 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-indigo-50 shadow-2xl shadow-indigo-900/10 overflow-hidden"
                        >
                            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-indigo-100/50">
                                {/* Left Side: Motto */}
                                <div className="p-8 flex flex-col justify-center">
                                    <h3 className="text-base font-bold text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Star size={20} className="text-indigo-600" /> Our Motto
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg leading-tight">Start With Montessori</h4>
                                                <p className="text-sm text-slate-500 font-medium mt-1">Pre-primary to Grade 3</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg leading-tight">Rise with STEM</h4>
                                                <p className="text-sm text-slate-500 font-medium mt-1">Grade 4 to 8</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Connect */}
                                <div className="p-6 flex flex-col justify-center bg-slate-50/50">
                                    <h3 className="text-base font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <MapPin size={20} className="text-indigo-500" /> Connect
                                    </h3>
                                    <div className="flex gap-2 justify-between">
                                        {/* Location */}
                                        <a
                                            href="https://maps.app.goo.gl/Rfmy5nMw33EQ29yD6?g_st=aw"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-white p-2 rounded-2xl transition-all duration-300 flex-1 hover:shadow-xl hover:shadow-indigo-900/5 border border-transparent hover:border-slate-100 min-w-0"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-sm border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                                                <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center">
                                                    <MapPin size={24} className="text-indigo-600" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 text-center tracking-wide whitespace-nowrap">Locate Us</span>
                                        </a>

                                        <div className="w-px bg-slate-200 my-2 shrink-0"></div>

                                        {/* Instagram */}
                                        <a
                                            href="https://www.instagram.com/stem.global?igsh=ZHBoZGM0MnA0N3Nx"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-white p-2 rounded-2xl transition-all duration-300 flex-1 hover:shadow-xl hover:shadow-pink-900/5 border border-transparent hover:border-pink-50 min-w-0"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-sm border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                                                <img
                                                    src="/images/insta-scanner.jpg.jpeg"
                                                    alt="Insta"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 text-center tracking-wide whitespace-nowrap">Follow Us</span>
                                        </a>

                                        <div className="w-px bg-slate-200 my-2 shrink-0"></div>

                                        {/* Facebook */}
                                        <a
                                            href="https://www.facebook.com/share/1CAeVsczQU/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:bg-white p-2 rounded-2xl transition-all duration-300 flex-1 hover:shadow-xl hover:shadow-blue-900/5 border border-transparent hover:border-blue-50 min-w-0"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-sm border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                                                <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center">
                                                    <Facebook size={24} className="text-blue-600" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-600 text-center tracking-wide whitespace-nowrap">Like Page</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Highlights Grid - Static & Catchy */}
            <div className="mt-8 md:mt-16 w-full relative z-20 px-4 pb-12 md:pb-0">
                <div className="text-center mb-8">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs md:text-sm tracking-widest uppercase mb-3 shadow-sm">
                        Why Choose Us?
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                        Excellence in <span className="text-indigo-600">Every Detail</span>
                    </h3>
                </div>

                <div className="max-w-6xl mx-auto">
                    {/* Center "No Donation" - Distinct and Top */}
                    <div className="flex justify-center mb-3 md:mb-5">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-yellow-200 bg-yellow-50 text-yellow-800 font-bold text-sm md:text-lg shadow-md cursor-default transition-all duration-300"
                        >
                            <span className="text-lg md:text-2xl">✨</span>
                            <span className="tracking-wide uppercase">No Donation</span>
                        </motion.div>
                    </div>

                    {/* Remaining Points Grid */}
                    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-center md:gap-4">
                        {[
                            { text: "Individual Attention", icon: "🎓", color: "bg-blue-50 text-blue-700 border-blue-200" },
                            { text: "Experienced Faculties", icon: "👩‍🏫", color: "bg-green-50 text-green-700 border-green-200" },
                            { text: "Samastha Madrasa Education", icon: "🕌", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                            { text: "Value Education", icon: "🌟", color: "bg-purple-50 text-purple-700 border-purple-200" },
                            { text: "Park facilities", icon: "🎡", color: "bg-pink-50 text-pink-700 border-pink-200" },
                            { text: "AC Classroom", icon: "❄️", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
                            { text: "Second Home for kids", icon: "🏠", color: "bg-rose-50 text-rose-700 border-rose-200" },
                            { text: "Montessori System", icon: "🧩", color: "bg-orange-50 text-orange-700 border-orange-200" },
                            { text: "CBSE Syllabus", icon: "📚", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                            { text: "STEM Education", icon: "🔬", color: "bg-teal-50 text-teal-700 border-teal-200" }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className={`flex items-center justify-center md:justify-start gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border shadow-sm font-bold text-xs md:text-base cursor-default transition-all duration-300 ${item.color}`}
                            >
                                <span className="text-base md:text-xl drop-shadow-sm">{item.icon}</span>
                                <span className="tracking-wide text-center md:text-left">{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section >
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
                                {/* Motto removed and moved to Hero */}
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

                                    <ul className="space-y-3 pt-4">
                                        {[
                                            "Child-friendly, stress-free learning environment",
                                            "Highly qualified, skilled & experienced faculty",
                                            "Visual, hands-on & experiential teaching methods",
                                            "Individual attention & value-based education",
                                            "Strong academic foundation with life skills"
                                        ].map((point, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check size={14} className="text-orange-600" strokeWidth={3} />
                                                </div>
                                                <span className="text-slate-700 text-base font-medium">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
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
                            {/* Top Center Image */}
                            <div className="col-span-2">
                                <img
                                    src="/images/aboutus/ABM05698.webp"
                                    alt="Campus Life"
                                    loading="lazy"
                                    decoding="async"
                                    className="rounded-2xl w-full h-auto md:h-80 object-cover shadow-lg hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Bottom Row */}
                            <img
                                src="/images/aboutus/ABM05002.webp"
                                alt="Classroom"
                                loading="lazy"
                                decoding="async"
                                className="rounded-2xl w-full h-auto md:h-64 object-cover shadow-lg hover:scale-105 transition-transform duration-500"
                            />
                            <img
                                src="/images/aboutus/ABM04942.webp"
                                alt="Student Activities"
                                loading="lazy"
                                decoding="async"
                                className="rounded-2xl w-full h-auto md:h-64 object-cover shadow-lg hover:scale-105 transition-transform duration-500"
                            />
                        </motion.div>

                        {/* Decorative background elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-full blur-3xl -z-10 opacity-60"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};



const LifeAtCampus = () => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const events = [
        {
            title: "Children's Day",
            theme: "Celebrating Innocence",
            date: "Nov 14",
            image: "childrensday/Screenshot 2026-01-27 124725.png",
            description: "A day dedicated to the joy and potential of every child, filled with fun, games, and laughter."
        },
        {
            title: "Yoga Day",
            theme: "Mindfulness & Health",
            date: "June 21",
            image: "yogaday/Screenshot 2026-01-27 124836.png",
            description: "Uniting mind and body through the practice of yoga, fostering physical and mental well-being."
        },
        {
            title: "Visit to Ayur Green",
            theme: "Connecting with Nature",
            image: "ayurgreenday/Screenshot 2026-01-27 124756.png",
            description: "An educational trip to explore medicinal plants and understand the importance of ayurveda and nature conservation."
        },
        {
            title: "Traffic Awareness",
            theme: "Safety First",
            image: "trafficday/Screenshot 2026-01-27 124737.png",
            description: "Empowering students with essential road safety rules and responsible citizenship awareness."
        },
        {
            title: "Electronics Workshop",
            theme: "Innovation & Tech",
            image: "electronicsworkshop/Screenshot 2026-01-27 124707.png",
            description: "Hands-on experience with circuits and electronics to spark curiosity and engineering minds."
        },
        {
            title: "Smiley Day",
            theme: "Spread Happiness",
            image: "smileyday/Screenshot 2026-01-27 124823.png",
            description: "A vibrant day focused on positivity, kindness, and the power of a simple smile."
        },
        {
            title: "Black & White Day",
            theme: "Harmony in Contrast",
            image: "blackwhiteday/Screenshot 2026-01-27 124809.png",
            description: "Exploring the beauty of monochrome while understanding unity in diversity."
        }
    ];

    return (
        <section id="lifeatcampus" className="py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionHeader
                    title="Life at Campus"
                    subtitle="Every day is a new opportunity to learn, grow, and celebrate together! Experience our vibrant community."
                />

                <div className="relative mt-12 group/section">
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-50 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100 disabled:opacity-50"
                        aria-label="Scroll left"
                    >
                        <ArrowRight className="rotate-180" size={24} />
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-50 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100 disabled:opacity-50"
                        aria-label="Scroll right"
                    >
                        <ArrowRight size={24} />
                    </button>

                    {/* Scroll Container */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {events.map((event, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="min-w-[85vw] md:min-w-[300px] lg:min-w-[calc(20%-20px)] snap-start bg-slate-50 rounded-3xl overflow-hidden shadow-lg border border-slate-100 group cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={`/images/${event.image}`}
                                        alt={event.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-contain md:object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 shadow-sm uppercase tracking-wide">
                                        {event.theme}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{event.title}</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3 flex-grow">{event.description}</p>

                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs group-hover:translate-x-1 transition-transform mt-auto text-indigo-600">
                                        View Moments <ArrowRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Events = () => {
    // 1. Featured Image (Static)
    const featuredImage = "ABM05870.webp";

    // 2. Marquee Images (The "Train")
    const marqueeImages = [
        "ABM05337.webp", "ABM05340.webp", "ABM05383.webp", "ABM05419.webp",
        "ABM05506.webp", "ABM05631.webp", "ABM05682.webp", "ABM05706.webp",
        "ABM05717.webp", "ABM05726.webp"
    ];

    // Duplicate list for seamless loop
    const flowImages = [...marqueeImages, ...marqueeImages];

    return (
        <section id="events" className="py-32 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-6 mb-12">
                <SectionHeader
                    title="Celebrations & Milestones"
                    subtitle="Honoring our traditions and celebrating our achievements together."
                />
            </div>

            {/* Annual Day - Separated Blocks Layout */}
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text Content Side */}
                    <div className="order-2 lg:order-1">
                        <motion.div
                            className="w-full"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
                                Latest Event
                            </span>
                            <h3 className="text-2xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Annual Day & <br />
                                <span className="text-indigo-600">Inaugural Function</span>
                            </h3>
                            <div className="w-full space-y-6 text-base md:text-lg text-slate-600 leading-relaxed mb-8 break-words text-justify md:text-left hyphens-auto">
                                <p>
                                    We are delighted to share glimpses of our Annual Day and Inaugural Function, a momentous occasion graced by the
                                    <span className="font-bold text-slate-700"> Honorable Minister MB Rajesh</span>.
                                </p>
                                <p>
                                    The day was filled with joy and vibrancy as our students mesmerized the audience with their spectacular cultural performances, showcasing their talents and celebrating the true spirit of our school community.
                                </p>
                            </div>

                            <a
                                href="https://photos.app.goo.gl/vZS57LcXdbcVAd4f8"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/30 group"
                            >
                                View Full Gallery
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        </motion.div>
                    </div>

                    {/* Visual Side */}
                    <div className="order-1 lg:order-2 bg-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border border-slate-100">
                        {/* Static Featured Image - Mobile Fix applied for ABM05870 */}
                        <div className="w-full aspect-video md:aspect-auto md:h-[400px] overflow-hidden relative bg-slate-100">
                            <img
                                src={`/images/annualday/${featuredImage}`}
                                alt="Inaugural Function Main"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain md:object-cover"
                            />

                        </div>

                        {/* Moving Train (Marquee) */}
                        <div className="h-[200px] bg-slate-900 relative flex items-center overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>

                            <motion.div
                                className="flex gap-4 px-4"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{
                                    ease: "linear",
                                    duration: 30,
                                    repeat: Infinity,
                                    repeatType: "loop"
                                }}
                                style={{ width: "max-content", willChange: "transform" }}
                            >
                                {flowImages.map((img, idx) => (
                                    <div
                                        key={`train-${idx}`}
                                        className="w-[250px] h-[160px] rounded-xl overflow-hidden flex-shrink-0 border-2 border-slate-700/50"
                                    >
                                        <img
                                            src={`/images/annualday/${img}`}
                                            alt={`Event moment ${idx}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section >
    );
};

const CampusTour = () => {
    const categories = [
        {
            title: "School Building",
            images: ["ABM04857.webp"],
            size: "large", // spans 2 cols
            desc: "A modern architectural marvel designed for safety and inspiration."
        },
        {
            title: "Reception Area",
            images: ["ABM04903.webp"],
            size: "small", // spans 1 col
            desc: "Welcoming spaces for parents and visitors."
        },
        {
            title: "Principal's Office",
            images: ["ABM04883.webp"],
            size: "small",
            desc: "Where leadership meets vision."
        },
        {
            title: "Conference Hall",
            images: ["ABM04891.webp", "ABM04870.webp"],
            size: "medium",
            desc: "State-of-the-art facility for events and gatherings."
        },
        {
            title: "Playground & Sports",
            images: ["ABM05033.webp", "ABM05036.webp", "ABM05217.webp"],
            size: "wide", // full width or large
            desc: "Expansive grounds for physical development and recreation."
        }
    ];

    return (
        <section id="campustour" className="py-32 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <SectionHeader
                    title="Experience Our Campus"
                    subtitle="A world-class environment designed to inspire learning, creativity, and growth."
                    centered={true}
                />

                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Features List - Left Side on Desktop, Bottom on Mobile */}
                    <div className="w-full lg:w-1/3 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <School size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Infrastructure & Facilities</h3>
                            </div>

                            <ul className="space-y-6">
                                {[
                                    "Modern, safe & well-ventilated campus",
                                    "Well-equipped Montessori Labs",
                                    "Advanced STEM LAB",
                                    "Kids’ Park & activity zones",
                                    "Smart classrooms & learning resources"
                                ].map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle size={14} />
                                        </div>
                                        <span className="text-slate-600 font-medium leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <p className="text-slate-500 text-sm leading-relaxed italic">
                                    "Designed to provide a safe, stimulating, and supportive environment for every child."
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Image Grid - Right Side on Desktop, Top on Mobile */}
                    <div className="w-full lg:w-2/3 order-1 lg:order-2 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[300px]">
                        {/* Building - Large Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group shadow-xl"
                        >
                            <img
                                src={`/images/campustour/${categories[0].images[0]}`}
                                alt={categories[0].title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-[300px] md:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-white text-2xl font-bold mb-2">{categories[0].title}</h3>
                                <p className="text-slate-200 text-sm">{categories[0].desc}</p>
                            </div>
                        </motion.div>

                        {/* Reception - Small Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-1 md:row-span-1 relative rounded-3xl overflow-hidden group shadow-xl"
                        >
                            <img
                                src={`/images/campustour/${categories[1].images[0]}`}
                                alt={categories[1].title}
                                className="w-full h-[250px] md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex flex-col justify-end p-6">
                                <h3 className="text-white text-lg font-bold">{categories[1].title}</h3>
                            </div>
                        </motion.div>

                        {/* Principal's Room - Small Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-1 md:row-span-1 relative rounded-3xl overflow-hidden group shadow-xl"
                        >
                            <img
                                src={`/images/campustour/${categories[2].images[0]}`}
                                alt={categories[2].title}
                                className="w-full h-[250px] md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex flex-col justify-end p-6">
                                <h3 className="text-white text-lg font-bold">{categories[2].title}</h3>
                            </div>
                        </motion.div>

                        {/* Conference Hall - Medium Card (Slider concept or grid) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="md:col-span-2 md:row-span-1 relative rounded-3xl overflow-hidden group shadow-xl bg-white"
                        >
                            <div className="grid grid-cols-2 h-full">
                                {categories[3].images.map((img, i) => (
                                    <div key={i} className="h-full overflow-hidden relative">
                                        <img
                                            src={`/images/campustour/${img}`}
                                            alt={`${categories[3].title} ${i}`}
                                            className="w-full h-[250px] md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/10"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
                                <h3 className="text-white text-xl font-bold">{categories[3].title}</h3>
                                <p className="text-slate-200 text-xs mt-1">{categories[3].desc}</p>
                            </div>
                        </motion.div>

                        {/* Playground - Wide Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="md:col-span-4 md:row-span-1 relative rounded-3xl overflow-hidden group shadow-xl bg-slate-800"
                        >
                            <div className="grid grid-cols-3 h-full gap-0.5">
                                {categories[4].images.map((img, i) => (
                                    <div key={i} className="h-full overflow-hidden relative group/item">
                                        <img
                                            src={`/images/campustour/${img}`}
                                            alt={`${categories[4].title} ${i}`}
                                            className="w-full h-[300px] md:h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl">
                                <h3 className="text-slate-900 text-xl font-bold flex items-center gap-2">
                                    <Smile className="text-indigo-600" size={20} />
                                    {categories[4].title}
                                </h3>
                            </div>
                        </motion.div>
                    </div>
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
                    Admissions are open for the 2026-27 academic year. Give your child the gift of world-class education.
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

const Gallery = () => {
    // 14 images available in public/images/gallery
    const allImages = [
        "ABM04971.webp", "ABM05018.webp", "ABM05916.webp",
        "ABM06311.webp", "ABM06378.webp", "ABM06393.webp",
        "ABM06419.webp", "ABM06536.webp", "ABM06566.webp", "ABM06602.webp",
        "ABM06641.webp", "ABM06656.webp"
    ];

    // Grid configuration: 7 slots
    // We maintain 'front' and 'back' images for each slot to handle 3D flips
    const [frontImages, setFrontImages] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [backImages, setBackImages] = useState([7, 8, 9, 10, 11, 0, 1]); // Initial hidden images
    const [isFlipped, setIsFlipped] = useState([false, false, false, false, false, false, false]);

    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Pick a random slot to flip
            const slot = Math.floor(Math.random() * 7);

            setFrontImages(currentFront => {
                setBackImages(currentBack => {
                    setIsFlipped(currentFlipped => {
                        const flipped = [...currentFlipped];
                        const front = [...currentFront];
                        const back = [...currentBack];

                        // Determine which images are strictly VISIBLE right now across all slots
                        // For slot 'i', if flipped[i] is true, back[i] is visible. Else front[i] is visible.
                        const visibleIndices = new Set();
                        for (let i = 0; i < 7; i++) {
                            if (i === slot) continue; // Don't count the side we're about to flip AWAY from (though strictly it's visible now)
                            // Actually, we want to ensure the NEW image we pick isn't visible ANYWHERE else.
                            visibleIndices.add(flipped[i] ? back[i] : front[i]);
                        }
                        // Also add the currently visible image of the target slot? NO, we are replacing it?
                        // No, we are replacing the HIDDEN side.
                        // The VISIBLE side of the target slot is already known. We don't care if the new image matches the OLD visible image (it won't because we pick from distinct pool?).
                        // Just ensure new image isn't currently seen on screen.

                        // Pick a random image NOT in visibleIndices
                        let newImgIdx;
                        let attempts = 0;
                        do {
                            newImgIdx = Math.floor(Math.random() * allImages.length);
                            attempts++;
                        } while (visibleIndices.has(newImgIdx) && attempts < 20);

                        // If currently flipped (Back is visible), we want to update Front (hidden) and flip to Front (false).
                        // If currently !flipped (Front is visible), we want to update Back (hidden) and flip to Back (true).

                        if (flipped[slot]) {
                            // Back is visible. Update Front.
                            front[slot] = newImgIdx;
                            flipped[slot] = false; // Flip to Front
                        } else {
                            // Front is visible. Update Back.
                            back[slot] = newImgIdx;
                            flipped[slot] = true; // Flip to Back
                        }

                        // We can't update all 3 states atomically in one go if we use separate setters inside like this without functional updates correctly.
                        // Actually, I am inside nested Setters.
                        // This is getting messy with nested setters.
                        // Better to do logic outside and set.
                        return flipped;
                    });
                    return currentBack; // This won't update properly due to closure if I don't return modified back. 
                });
                return currentFront;
            });

            // Refactored Logic: Use a single setState logic or functional update carefully.
            // Since we need to read from all 3 states, it's better to use refs or just use simple state updates relying on the closure (which might be stale) 
            // OR use a useReducer. 
            // EASIEST: Just use state from closure since interval runs often? No, closure stale trap.
            // BETTER: Use function inside setFrontImages, but we need access to other states.
            // BEST: Use refs for the state that doesn't trigger render? No.

            // Let's Restart the Effect implementation to be clean.
        }, 3000);
        return () => clearInterval(interval);
    }, []); // Empty dependency? Then state is stale. 

    // Correct Implementation with Dependency Array:
    useEffect(() => {
        const timer = setTimeout(() => {
            const slot = Math.floor(Math.random() * 7);

            // Determine visible images
            const visibleIndices = new Set();
            for (let i = 0; i < 7; i++) {
                visibleIndices.add(isFlipped[i] ? backImages[i] : frontImages[i]);
            }

            let newImgIdx;
            let attempts = 0;
            const poolSize = allImages.length;
            do {
                newImgIdx = Math.floor(Math.random() * poolSize);
                attempts++;
            } while (visibleIndices.has(newImgIdx) && attempts < 30);

            // Update states
            if (isFlipped[slot]) {
                // Back -> Front
                const newFront = [...frontImages];
                newFront[slot] = newImgIdx;
                setFrontImages(newFront);

                const newFlipped = [...isFlipped];
                newFlipped[slot] = false;
                setIsFlipped(newFlipped);
            } else {
                // Front -> Back
                const newBack = [...backImages];
                newBack[slot] = newImgIdx;
                setBackImages(newBack);

                const newFlipped = [...isFlipped];
                newFlipped[slot] = true;
                setIsFlipped(newFlipped);
            }

        }, 2500); // Run once, then effect re-runs because dependencies change.
        return () => clearTimeout(timer);
    }, [frontImages, backImages, isFlipped, allImages.length]);
    // This effectively acts like an interval that re-evaluates with fresh state every time state changes.

    return (
        <section id="gallery" className="py-24 bg-white relative">
            <div className="container mx-auto px-6">
                <SectionHeader title="Captured Moments" subtitle="Glimpses of joy, learning, and discovery from our daily campus life." />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 auto-rows-[150px] md:auto-rows-[200px]">
                    {/* Slot 0: Large Square (2x2) */}
                    <GallerySlot
                        className="col-span-2 row-span-2"
                        frontImage={allImages[frontImages[0]]}
                        backImage={allImages[backImages[0]]}
                        isFlipped={isFlipped[0]}
                    />

                    {/* Slot 1: Tall (1x2) */}
                    <GallerySlot
                        className="row-span-2"
                        frontImage={allImages[frontImages[1]]}
                        backImage={allImages[backImages[1]]}
                        isFlipped={isFlipped[1]}
                    />

                    {/* Slot 2: Standard (1x1) */}
                    <GallerySlot
                        className=""
                        frontImage={allImages[frontImages[2]]}
                        backImage={allImages[backImages[2]]}
                        isFlipped={isFlipped[2]}
                    />

                    {/* Slot 3: Standard (1x1) */}
                    <GallerySlot
                        className=""
                        frontImage={allImages[frontImages[3]]}
                        backImage={allImages[backImages[3]]}
                        isFlipped={isFlipped[3]}
                    />

                    {/* Slot 4: Standard (1x1) */}
                    <GallerySlot
                        className=""
                        frontImage={allImages[frontImages[4]]}
                        backImage={allImages[backImages[4]]}
                        isFlipped={isFlipped[4]}
                    />

                    {/* Slot 5: Standard (1x1) */}
                    <GallerySlot
                        className=""
                        frontImage={allImages[frontImages[5]]}
                        backImage={allImages[backImages[5]]}
                        isFlipped={isFlipped[5]}
                    />

                    {/* Slot 6: Wide (2x1) */}
                    <GallerySlot
                        className="col-span-2"
                        frontImage={allImages[frontImages[6]]}
                        backImage={allImages[backImages[6]]}
                        isFlipped={isFlipped[6]}
                    />
                </div>



                <div className="text-center mt-12">
                    <a href="https://photos.app.goo.gl/vZS57LcXdbcVAd4f8" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-slate-50 text-slate-900 rounded-full font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2 border border-slate-200">
                        View Full Gallery <ArrowRight size={18} />
                    </a>
                </div>
            </div>
        </section>
    );
};

// Helper Component for Flipping Cell
const GallerySlot = ({ className, frontImage, backImage, isFlipped }) => {
    return (
        <div className={`relative perspective-1000 group ${className}`}>
            <motion.div
                className="w-full h-full relative preserve-3d transition-transform duration-1000"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front Face */}
                <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden bg-slate-100">
                    <img
                        src={`/images/gallery/${frontImage}`}
                        alt="Gallery"
                        className="w-full h-full object-contain md:object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden bg-slate-100"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <img
                        src={`/images/gallery/${backImage}`}
                        alt="Gallery"
                        className="w-full h-full object-contain md:object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
            </motion.div>
        </div>
    );
};

const Board = () => {
    const chairman = {
        name: "Mr. Regi V. George",
        role: "Principal & Chairman",
        img: "Reji.jpeg"
    };

    const heads = [
        {
            name: "Ms. Sabira T S",
            role: "Headmistress",
            img: "Sabira.jpeg"
        },
        {
            name: "Ms. Sithara Sajid",
            role: "Academic Coordinator",
            img: "Sithara.jpeg"
        }
    ];

    const members = [
        { name: "Mr. Jayaraj V", role: "Board Member", img: "Jayaraj.jpeg", position: "object-top" },
        { name: "Mr. Shaji P", role: "Board Member", img: "Shaji.jpeg" },
        { name: "Ms.Sabna P", role: "Board Member", img: "Sabna.jpeg" },
        { name: "Ms. Fathima Thasneem CM", role: "Board Member", img: "Fathima.jpeg" },
        { name: "Ms.Rameena Jaleel", role: "Board Member", img: "Raameena.jpeg" },
        { name: "Mr. Jayadevan V", role: "Board Member", img: "Jayadevan.jpeg", position: "object-top" }
    ];

    // Helper for Card
    const MemberCard = ({ member, size = "small" }) => {
        const isLarge = size === "large";
        const isMedium = size === "medium";
        const hasImage = !!member.img;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col items-center text-center ${isLarge ? 'max-w-xs' : 'max-w-[200px]'} mx-auto`}
            >
                {/* Square Box */}
                <div className={`
                    relative overflow-hidden rounded-2xl md:rounded-3xl border-4 border-white shadow-lg bg-slate-200 mb-4 flex items-center justify-center
                    ${isLarge ? 'w-48 h-48 md:w-56 md:h-56' : isMedium ? 'w-36 h-36 md:w-40 md:h-40' : 'w-28 h-28 md:w-32 md:h-32'}
                `}>
                    {hasImage ? (
                        <img
                            src={`/images/boardmembers/${member.img}`}
                            alt={member.name}
                            className={`w-full h-full object-cover ${member.position || ''}`}
                            loading="lazy"
                        />
                    ) : (
                        <Users className="text-slate-400" size={isLarge ? 64 : isMedium ? 48 : 32} opacity={0.5} />
                    )}
                </div>

                <h3 className={`font-bold text-slate-900 ${isLarge ? 'text-2xl' : isMedium ? 'text-xl' : 'text-base'}`}>
                    {member.name}
                </h3>
                <p className={`text-indigo-600 font-medium uppercase tracking-wide ${isLarge ? 'text-sm' : 'text-xs'}`}>
                    {member.role}
                </p>
            </motion.div>
        );
    };

    return (
        <section id="board" className="py-24 bg-slate-50 relative">
            <div className="container mx-auto px-6">
                <SectionHeader title="Visionary Leadership" subtitle="Guided by experienced educators committed to excellence." centered={true} />

                <div className="flex flex-col gap-16 max-w-7xl mx-auto items-center">

                    {/* Tier 1: Chairman */}
                    <div className="w-full flex justify-center">
                        <MemberCard member={chairman} size="large" />
                    </div>

                    {/* Tier 2: Head Teachers */}
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 relative">
                        {/* Decorative connector line */}
                        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px bg-slate-200 -z-10 -translate-y-8"></div>

                        {heads.map((head, idx) => (
                            <MemberCard key={idx} member={head} size="medium" />
                        ))}
                    </div>

                    {/* Tier 3: Board Members */}
                    <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-x-4 gap-y-12 md:gap-16 w-full pt-8 border-t border-slate-200/60">
                        {members.map((member, idx) => (
                            <MemberCard key={idx} member={member} size="small" />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

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
                                    <div className="text-4xl font-bold text-indigo-500 mb-2">{item.step}</div>
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
                        <img src="/images/logo3.jpeg" alt="Stem Global Logo" className="w-12 h-12 object-contain" />
                        <span className="text-2xl font-bold text-white">STEM Global Public School</span>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-8">
                        Nurturing curiosity today, creating leaders for tomorrow. Where learning is a joyful adventure.
                    </p>
                    {/* Socials moved to Contact section */}
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
                    <ul className="space-y-4">
                        {['Home', 'About', 'Admissions', 'Campus Tour', 'Life at Campus', 'Events', 'Gallery', 'Board', 'Contact'].map(item => (
                            <li key={item}><a href={`#${item.toLowerCase().replace(/\s+/g, '')}`} className="hover:text-white transition-colors block">{item}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-lg">Contact</h4>
                    <ul className="space-y-4 text-slate-400">
                        <li>
                            <a
                                href="https://maps.app.goo.gl/Rfmy5nMw33EQ29yD6?g_st=aw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-3 hover:text-indigo-400 transition-colors group"
                            >
                                <MapPin size={20} className="shrink-0 text-indigo-400 group-hover:text-amber-400 transition-colors" />
                                <span>
                                    Eravakkad, Kollannoor<br />Kerala, 679552
                                    <span className="block text-xs text-indigo-400 mt-1 font-semibold group-hover:text-amber-400">View on Map →</span>
                                </span>
                            </a>
                        </li>
                        <li className="flex gap-3"><Phone size={20} className="shrink-0 text-indigo-400" /> +91 9746402501</li>
                        <li className="flex gap-3"><Mail size={20} className="shrink-0 text-indigo-400" /> stemnoreply@mystemgps.com</li>
                        <li className="flex gap-3"><Mail size={20} className="shrink-0 text-indigo-400" /> stemglobalpublicschool@gmail.com</li>
                    </ul>
                    <div className="flex gap-4 mt-6">
                        <a
                            href="https://www.facebook.com/share/1CAeVsczQU/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-slate-400 border border-slate-700 hover:border-blue-500"
                        >
                            <Facebook size={18} />
                        </a>
                        <a
                            href="https://www.instagram.com/stem.global?igsh=ZHBoZGM0MnA0N3Nx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all text-slate-400 border border-slate-700 hover:border-pink-500"
                        >
                            <Instagram size={18} />
                        </a>
                    </div>
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

    const initialFormState = {
        studentFirstName: '',
        studentMiddleName: '',
        studentLastName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        studentGrade: '',
        studentGender: '',
        studentBloodGroup: '',
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
            <LifeAtCampus />
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
                                    <h3 className="text-2xl font-bold">Fee Structure 2026-27</h3>
                                    <p className="text-indigo-100 text-sm">Transparent and affordable quality education</p>
                                </div>
                                <button onClick={() => setIsFeeModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* No Donation Highlight */}
                                <div className="bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 rounded-2xl p-6 text-center shadow-sm">
                                    <h4 className="text-2xl md:text-3xl font-black text-orange-600 uppercase tracking-wide flex items-center justify-center gap-3">
                                        <Star className="fill-orange-600" size={32} /> No Donation <Star className="fill-orange-600" size={32} />
                                    </h4>
                                    <p className="text-orange-800 font-medium mt-2">We believe in transparent and accessible education for all.</p>
                                </div>

                                {/* Fee Breakdown */}
                                <div className="max-w-xl mx-auto">
                                    <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                                        <div className="p-6 md:p-8 space-y-6">
                                            {/* Header */}
                                            <div className="text-center pb-6 border-b border-slate-100">
                                                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Annual Total Fee</p>
                                                <div className="text-5xl font-black text-slate-900 tracking-tight">
                                                    ₹ 26,500
                                                </div>
                                            </div>

                                            {/* Breakdown Items */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">Tuition Fee</p>
                                                            <p className="text-xs text-slate-500">Academic Year 2026-27</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-xl text-slate-700">₹ 20,000</span>
                                                </div>

                                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">Materials Fee</p>
                                                            <p className="text-xs text-slate-500">Books, Uniforms & Amenities</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-xl text-slate-700">₹ 6,500</span>
                                                </div>
                                            </div>

                                            {/* Bus Fee Notice */}
                                            <div className="mt-2 text-center p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                                                <div className="flex items-center justify-center gap-2 font-bold mb-2 text-lg">
                                                    <Users size={20} /> Transport / Bus Fee
                                                </div>
                                                <p className="text-base font-semibold text-slate-700">Calculated according to the boarding point/distance.</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 px-6 py-4 text-center border-t border-slate-100">
                                            <p className="text-xs font-medium text-slate-500">
                                                * Fees once paid are non-refundable. Terms and conditions apply.
                                            </p>
                                        </div>
                                    </div>
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
                            className="relative bg-white w-full max-w-lg md:max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-20 p-6 md:p-8 text-center max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <button
                                onClick={() => setIsAdmissionsContactOpen(false)}
                                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                                <Phone size={36} />
                            </div>

                            <h3 className="text-3xl font-bold text-slate-900 mb-3">Admissions Contact</h3>
                            <p className="text-slate-600 text-lg mb-8">Call us directly to secure your seat for the 2026-27 academic year.</p>

                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                                <a href="tel:+919746402501" className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                    <div className="text-left">
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Primary Contact</div>
                                        <div className="font-bold text-xl">+91 9746402501</div>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white shrink-0">
                                        <Phone size={20} />
                                    </div>
                                </a>
                                <a href="tel:+919544547511" className="flex items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm">
                                    <div className="text-left">
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Secondary Contact</div>
                                        <div className="font-bold text-xl">+91 9544547511</div>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white shrink-0">
                                        <Phone size={20} />
                                    </div>
                                </a>
                            </div>

                            {/* Key Highlights */}
                            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 text-left mb-8">
                                <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <Star size={24} className="text-orange-500 fill-orange-500" /> Why Choose Us?
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        "No Donation",
                                        "Individual Attention",
                                        "Experienced Faculties",
                                        "Samastha Madrasa Education",
                                        "Value Education",
                                        "Park Facilities",
                                        "AC Classrooms",
                                        "Second Home for Kids",
                                        "Montessori System",
                                        "CBSE Syllabus",
                                        "STEM Education"
                                    ].map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-base md:text-lg text-slate-700 font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" />
                                            <span className="leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsAdmissionsContactOpen(false)}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg"
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
                                                <input required type="text" onFocus={(e) => (e.target.type = "date")} onBlur={(e) => (e.target.type = "text")} name="dob" placeholder="Date of Birth" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.dob} onChange={handleChange} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Grade Sought *</label>
                                                <select required name="studentGrade" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.studentGrade} onChange={handleChange}>
                                                    <option value="">Select Grade</option>
                                                    <option value="Mont 1">Mont 1</option>
                                                    <option value="Mont 2">Mont 2</option>
                                                    <option value="Grade 1">Grade 1</option>
                                                    <option value="Grade 2">Grade 2</option>
                                                    <option value="Grade 3">Grade 3</option>
                                                    <option value="Grade 4">Grade 4</option>
                                                    <option value="Grade 5">Grade 5</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Gender *</label>
                                                <select required name="studentGender" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.studentGender} onChange={handleChange}>
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Blood Group *</label>
                                                <select required name="studentBloodGroup" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600" value={enquiryForm.studentBloodGroup} onChange={handleChange}>
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
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

