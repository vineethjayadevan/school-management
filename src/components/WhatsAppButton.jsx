import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    const phoneNumber = '919746402501';
    const message = 'Hello STEM Global Public School, I would like to know about admissions.';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 animate-soft-pulse group"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle size={32} fill="white" className="group-hover:rotate-12 transition-transform duration-300" />

            {/* Tooltip */}
            <span className="absolute right-16 bg-white text-slate-900 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none border border-slate-100">
                Chat with us
            </span>
        </a>
    );
};

export default WhatsAppButton;
