'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import MosqueAlert from '@/components/MosqueAlert';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            router.push('/admin');
            return;
        }

        // Check dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await login({ email, password });

            if (response.success && 'data' in response) {
                // Store token and user info in localStorage
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Show success alert
                MosqueAlert.loginSuccess(response.data.user.name);

                // Redirect to admin dashboard after delay
                setTimeout(() => {
                    router.push('/admin');
                }, 2000);
            } else {
                MosqueAlert.error('Login Gagal', response.message || 'Email atau password salah.');
                setError(response.message || 'Login gagal. Silakan coba lagi.');
            }
        } catch (err) {
            MosqueAlert.error('Terjadi Kesalahan', 'Tidak dapat terhubung ke server. Silakan coba lagi.');
            setError('Terjadi kesalahan. Silakan coba lagi.');
        }

        setLoading(false);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode
            ? 'bg-slate-900'
            : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'
            } islamic-pattern`}>
            {/* Dark Mode Toggle - Fixed Position */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all hover:scale-110 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-gray-100'
                    }`}
                title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
                {darkMode ? '☀️' : '🌙'}
            </button>

            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full mx-auto flex items-center justify-center text-5xl shadow-xl mb-4">
                        🕌
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        Admin Panel
                    </h1>
                    <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>
                        Sistem Pengumuman Masjid Digital
                    </p>
                </div>

                {/* Login Form */}
                <div className={`rounded-2xl shadow-xl p-8 border-2 transition-colors ${darkMode
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-emerald-100'
                    }`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className={`px-4 py-3 rounded-xl text-sm ${darkMode
                                ? 'bg-red-900/30 border border-red-800 text-red-300'
                                : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@masjid.com"
                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 outline-none ${darkMode
                                    ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500'
                                    }`}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 outline-none ${darkMode
                                    ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500'
                                    }`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Masuk...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                            ← Kembali ke Beranda
                        </Link>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className={`mt-6 rounded-xl p-4 text-center ${darkMode
                    ? 'bg-amber-900/30 border border-amber-800'
                    : 'bg-amber-50 border border-amber-200'
                    }`}>
                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                        Demo Login
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        Email: admin@masjid.com | Password: password123
                    </p>
                </div>
            </div>
        </div>
    );
}
