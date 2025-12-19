'use client';

import { useState, useEffect, useCallback } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
    text: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface AlertOptions {
    type?: AlertType;
    title: string;
    message?: string;
    icon?: string;
    showCloseButton?: boolean;
    autoClose?: number; // milliseconds, 0 = no auto close
    buttons?: AlertButton[];
    onClose?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertState extends AlertOptions {
    isOpen: boolean;
}

// Global state for alerts
let globalSetAlert: ((state: AlertState) => void) | null = null;

// Theme-matched icons
const ALERT_ICONS: Record<AlertType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    confirm: '❓',
};

// Theme-matched colors (emerald/Islamic theme)
const ALERT_COLORS: Record<AlertType, { bg: string; border: string; iconBg: string }> = {
    success: {
        bg: 'from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-800',
        border: 'border-emerald-300 dark:border-emerald-700',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    },
    error: {
        bg: 'from-red-50 to-white dark:from-red-900/30 dark:to-slate-800',
        border: 'border-red-300 dark:border-red-700',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
    },
    warning: {
        bg: 'from-amber-50 to-white dark:from-amber-900/30 dark:to-slate-800',
        border: 'border-amber-300 dark:border-amber-700',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    },
    info: {
        bg: 'from-blue-50 to-white dark:from-blue-900/30 dark:to-slate-800',
        border: 'border-blue-300 dark:border-blue-700',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    },
    confirm: {
        bg: 'from-purple-50 to-white dark:from-purple-900/30 dark:to-slate-800',
        border: 'border-purple-300 dark:border-purple-700',
        iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    },
};

// Alert Provider Component
export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        title: '',
        type: 'info',
    });

    useEffect(() => {
        globalSetAlert = setAlert;
        return () => {
            globalSetAlert = null;
        };
    }, []);

    const closeAlert = useCallback(() => {
        setAlert((prev) => ({ ...prev, isOpen: false }));
        alert.onClose?.();
    }, [alert]);

    const handleConfirm = useCallback(() => {
        alert.onConfirm?.();
        closeAlert();
    }, [alert, closeAlert]);

    const handleCancel = useCallback(() => {
        alert.onCancel?.();
        closeAlert();
    }, [alert, closeAlert]);

    useEffect(() => {
        if (alert.isOpen && alert.autoClose && alert.autoClose > 0) {
            const timer = setTimeout(closeAlert, alert.autoClose);
            return () => clearTimeout(timer);
        }
    }, [alert.isOpen, alert.autoClose, closeAlert]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && alert.isOpen) {
                closeAlert();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [alert.isOpen, closeAlert]);

    const type = alert.type || 'info';
    const colors = ALERT_COLORS[type];
    const icon = alert.icon || ALERT_ICONS[type];

    return (
        <>
            {children}

            {/* Alert Modal */}
            {alert.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                        onClick={closeAlert}
                    />

                    {/* Alert Box */}
                    <div
                        className={`relative w-full max-w-md transform transition-all duration-300 animate-scaleIn`}
                    >
                        <div
                            className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} bg-gradient-to-b ${colors.bg} shadow-2xl`}
                        >
                            {/* Islamic Pattern Overlay */}
                            <div className="absolute inset-0 opacity-5 islamic-pattern pointer-events-none" />

                            {/* Close Button */}
                            {alert.showCloseButton !== false && (
                                <button
                                    onClick={closeAlert}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/80 dark:bg-slate-700/80 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-gray-600 dark:text-gray-300 z-10"
                                >
                                    ✕
                                </button>
                            )}

                            {/* Content */}
                            <div className="relative p-8 text-center">
                                {/* Icon with Animation */}
                                <div
                                    className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${colors.iconBg} mb-6 animate-bounceIn`}
                                >
                                    <span className="text-5xl">{icon}</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {alert.title}
                                </h3>

                                {/* Message */}
                                {alert.message && (
                                    <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
                                        {alert.message}
                                    </p>
                                )}

                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {alert.buttons ? (
                                        alert.buttons.map((btn, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    btn.onClick?.();
                                                    closeAlert();
                                                }}
                                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${btn.variant === 'danger'
                                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                                        : btn.variant === 'secondary'
                                                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white'
                                                            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                                                    }`}
                                            >
                                                {btn.text}
                                            </button>
                                        ))
                                    ) : alert.type === 'confirm' ? (
                                        <>
                                            <button
                                                onClick={handleCancel}
                                                className="px-6 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white transition-all duration-300"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleConfirm}
                                                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                Ya, Lanjutkan
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={closeAlert}
                                            className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            OK
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Decoration */}
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Alert Functions
export const MosqueAlert = {
    show(options: AlertOptions) {
        if (globalSetAlert) {
            globalSetAlert({
                ...options,
                isOpen: true,
            });
        }
    },

    success(title: string, message?: string, autoClose?: number) {
        this.show({
            type: 'success',
            title,
            message,
            icon: '🕌',
            autoClose: autoClose ?? 3000,
        });
    },

    error(title: string, message?: string) {
        this.show({
            type: 'error',
            title,
            message,
            icon: '😔',
        });
    },

    warning(title: string, message?: string) {
        this.show({
            type: 'warning',
            title,
            message,
            icon: '⚠️',
        });
    },

    info(title: string, message?: string) {
        this.show({
            type: 'info',
            title,
            message,
            icon: '📢',
        });
    },

    confirm(
        title: string,
        message?: string,
        onConfirm?: () => void,
        onCancel?: () => void
    ) {
        this.show({
            type: 'confirm',
            title,
            message,
            icon: '❓',
            onConfirm,
            onCancel,
        });
    },

    delete(itemName: string, onConfirm: () => void) {
        this.show({
            type: 'confirm',
            title: 'Hapus Data?',
            message: `Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`,
            icon: '🗑️',
            onConfirm,
            buttons: [
                { text: 'Batal', variant: 'secondary' },
                { text: 'Ya, Hapus', variant: 'danger', onClick: onConfirm },
            ],
        });
    },

    saved(itemName?: string) {
        this.success(
            'Berhasil Disimpan! 🎉',
            itemName ? `${itemName} telah berhasil disimpan.` : 'Data telah berhasil disimpan.',
            3000
        );
    },

    deleted(itemName?: string) {
        this.success(
            'Berhasil Dihapus',
            itemName ? `${itemName} telah berhasil dihapus.` : 'Data telah berhasil dihapus.',
            3000
        );
    },

    loginSuccess(userName?: string) {
        this.show({
            type: 'success',
            title: 'Assalamu\'alaikum! 🕌',
            message: userName ? `Selamat datang kembali, ${userName}!` : 'Selamat datang di Dashboard Admin!',
            icon: '👋',
            autoClose: 2500,
        });
    },

    logoutSuccess() {
        this.show({
            type: 'info',
            title: 'Sampai Jumpa! 👋',
            message: 'Anda telah berhasil keluar. Wassalamu\'alaikum.',
            icon: '🕌',
            autoClose: 2000,
        });
    },
};

export default MosqueAlert;
