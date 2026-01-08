import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="text-emerald-600" />;
            case 'error':
                return <XCircle size={20} className="text-red-600" />;
            case 'warning':
                return <AlertCircle size={20} className="text-amber-600" />;
            case 'info':
                return <Info size={20} className="text-blue-600" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50 border-emerald-200 text-emerald-900';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-900';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-900';
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-900';
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-[9999] min-w-[300px] max-w-md animate-in slide-in-from-top-2 fade-in duration-300`}>
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg ${getStyles()}`}>
                {getIcon()}
                <p className="flex-1 font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
