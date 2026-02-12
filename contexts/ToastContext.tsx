import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toast: (payload: Omit<Toast, 'id'>) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(({ type, title, message, duration = 4000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message, duration }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    const toast = useCallback((payload: Omit<Toast, 'id'>) => addToast(payload), [addToast]);
    const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
    const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);

    return (
        <ToastContext.Provider value={{ toast, success, error }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none pr-4 sm:pr-0">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
              pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all animate-slide-in-right
              ${t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-50' : ''}
              ${t.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-50' : ''}
              ${t.type === 'warning' ? 'bg-amber-950/80 border-amber-500/30 text-amber-50' : ''}
              ${t.type === 'info' ? 'bg-blue-950/80 border-blue-500/30 text-blue-50' : ''}
            `}
                    >
                        {/* Glossy Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                            {t.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
                            {t.type === 'error' && <ShieldAlert size={18} className="text-red-400" />}
                            {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-400" />}
                            {t.type === 'info' && <Info size={18} className="text-blue-400" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold leading-tight">{t.title}</h4>
                            {t.message && <p className="text-xs mt-1 opacity-80 leading-relaxed">{t.message}</p>}
                        </div>

                        {/* Close */}
                        <button
                            onClick={() => removeToast(t.id)}
                            className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        {/* Progress Bar (Visual flair) */}
                        <div
                            className={`absolute bottom-0 left-0 h-[2px] w-full animate-shrink-width origin-left
                ${t.type === 'success' ? 'bg-emerald-500' : ''}
                ${t.type === 'error' ? 'bg-red-500' : ''}
                ${t.type === 'warning' ? 'bg-amber-500' : ''}
                ${t.type === 'info' ? 'bg-blue-500' : ''}
              `}
                            style={{ animationDuration: `${t.duration}ms` }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
