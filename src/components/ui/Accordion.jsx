import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Accordion({ title, children, defaultOpen = false, isOpen: controlledIsOpen, onToggle, icon: Icon }) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    useEffect(() => {
        if (!isControlled) {
            setInternalIsOpen(defaultOpen);
        }
    }, [defaultOpen, isControlled]);

    const toggle = () => {
        if (isControlled) {
            onToggle && onToggle();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
            <button
                type="button"
                onClick={toggle}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-indigo-50 border-b border-indigo-100 text-indigo-900' : 'bg-slate-50 border-b border-slate-100 hover:bg-slate-100 text-slate-800'}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && <div className={`p-1.5 rounded-md ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500 shadow-sm border border-slate-100'}`}>
                        <Icon size={18} />
                    </div>}
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                        {title}
                    </h3>
                </div>
                <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-6 bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
}
