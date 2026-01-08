import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-600',
                    hover: 'hover:bg-red-700',
                    icon: 'text-red-600',
                    iconBg: 'bg-red-100'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-600',
                    hover: 'hover:bg-amber-700',
                    icon: 'text-amber-600',
                    iconBg: 'bg-amber-100'
                };
            case 'info':
                return {
                    bg: 'bg-blue-600',
                    hover: 'hover:bg-blue-700',
                    icon: 'text-blue-600',
                    iconBg: 'bg-blue-100'
                };
        }
    };

    const colors = getColors();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${colors.iconBg} flex-shrink-0`}>
                            <AlertTriangle className={colors.icon} size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-600 leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 ${colors.bg} ${colors.hover} text-white font-semibold rounded-xl transition-colors shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
