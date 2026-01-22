import { create } from 'zustand';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Store
export const useToast = create((set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Component
export function Toaster() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`flex items-center gap-3 min-w-[300px] p-4 rounded-lg shadow-lg border border-slate-100 ${t.type === 'success' ? 'bg-white text-green-700' :
                                t.type === 'error' ? 'bg-white text-red-700' : 'bg-slate-800 text-white'
                            }`}
                    >
                        {t.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                        {t.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                        {t.type === 'info' && <Info size={20} className="text-blue-400" />}

                        <p className="text-sm font-medium flex-1">{t.message}</p>
                        <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
