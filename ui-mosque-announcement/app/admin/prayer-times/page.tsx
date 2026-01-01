'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPrayerTimes, updatePrayerTimes, refreshPrayerTimes, logout } from '@/lib/api';
import { PrayerTimes } from '@/types/prayerTimes';
import { User } from '@/types/auth';
import MosqueAlert from '@/components/MosqueAlert';

export default function PrayerTimesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes>({
        subuh: '04:30',
        dzuhur: '12:00',
        ashar: '15:15',
        maghrib: '18:00',
        isya: '19:15',
        jumat: '11:30',
        imsak: '04:20',
    });
    const [prayerSource, setPrayerSource] = useState<string>('');
    const [prayerLocation, setPrayerLocation] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [nextPrayer, setNextPrayer] = useState<string>('');

    const loadPrayerTimes = useCallback(async () => {
        setLoading(true);
        const data = await fetchPrayerTimes();
        if (data && data.success) {
            setPrayerTimes(data.data);
            setPrayerSource(data.source || '');
            setPrayerLocation(data.location || '');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            router.push('/login');
            return;
        }

        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        loadPrayerTimes();
    }, [router, loadPrayerTimes]);

    useEffect(() => {
        // Set initial time on client-side only
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!currentTime) return;
        const now = currentTime;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const prayers = [
            { name: 'subuh', time: prayerTimes.subuh },
            { name: 'dzuhur', time: prayerTimes.dzuhur },
            { name: 'ashar', time: prayerTimes.ashar },
            { name: 'maghrib', time: prayerTimes.maghrib },
            { name: 'isya', time: prayerTimes.isya },
        ];

        for (const prayer of prayers) {
            if (!prayer.time) continue;
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerMinutes = hours * 60 + minutes;

            if (prayerMinutes > currentMinutes) {
                setNextPrayer(prayer.name);
                return;
            }
        }

        setNextPrayer('subuh');
    }, [currentTime, prayerTimes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess('');
        setError('');

        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const result = await updatePrayerTimes(prayerTimes, token);

        if (result.success) {
            setSuccess('Jadwal sholat berhasil diperbarui');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.message || 'Gagal memperbarui jadwal sholat');
        }

        setSaving(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setSuccess('');
        setError('');

        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const result = await refreshPrayerTimes(token);

        if (result.success) {
            setPrayerTimes(result.data.data);
            setPrayerSource(result.data.source || '');
            setPrayerLocation(result.data.location || '');
            setSuccess('Jadwal sholat berhasil diperbarui dari API');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.message || 'Gagal memperbarui jadwal sholat dari API');
        }

        setRefreshing(false);
    };

    const handleLogout = async () => {
        MosqueAlert.confirm(
            'Keluar dari Dashboard?',
            'Apakah Anda yakin ingin logout dari panel admin?',
            async () => {
                setLoggingOut(true);
                const token = localStorage.getItem('auth_token');
                if (token) {
                    try {
                        await logout(token);
                    } catch {
                        // Continue with logout even if API call fails
                    }
                }
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                MosqueAlert.logoutSuccess();
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            }
        );
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const prayerLabels = [
        { key: 'imsak', label: 'Imsak', icon: '🌙' },
        { key: 'subuh', label: 'Subuh', icon: '🌅' },
        { key: 'dzuhur', label: 'Dzuhur', icon: '☀️' },
        { key: 'ashar', label: 'Ashar', icon: '🌤️' },
        { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
        { key: 'isya', label: 'Isya', icon: '🌃' },
        { key: 'jumat', label: "Sholat Jum'at", icon: '🕌' },
    ];

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className={`mt-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <aside className={`fixed inset-y-0 left-0 w-64 ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-emerald-800 to-emerald-900'} text-white`}>
                <div className="p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🕌</div>
                        <div>
                            <h2 className="font-bold">Masjid Al-Ikhlas</h2>
                            <p className="text-emerald-200 text-xs">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-white/10">
                    <p className="text-xs text-emerald-200">Waktu Sekarang</p>
                    <p className="text-2xl font-bold clock-display" suppressHydrationWarning>
                        {currentTime ? formatTime(currentTime) : '--:--:--'}
                    </p>
                    {nextPrayer && (
                        <p className="text-xs text-amber-300 mt-1">
                            Sholat berikutnya: {nextPrayer.charAt(0).toUpperCase() + nextPrayer.slice(1)}
                        </p>
                    )}
                </div>

                <nav className="mt-4">
                    <Link href="/admin" className="flex items-center px-6 py-3 hover:bg-emerald-700/30 transition-colors">
                        <span className="mr-3">📋</span>Pengumuman
                    </Link>
                    <Link href="/admin/prayer-times" className="flex items-center px-6 py-3 bg-emerald-700/50 border-r-4 border-white">
                        <span className="mr-3">🕐</span>Jadwal Sholat
                    </Link>
                    <Link href="/" className="flex items-center px-6 py-3 hover:bg-emerald-700/30 transition-colors">
                        <span className="mr-3">🌐</span>Lihat Website
                    </Link>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name}</p>
                            <p className="text-emerald-200 text-xs truncate">{user?.email}</p>
                        </div>
                        <button onClick={toggleDarkMode} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg" title={darkMode ? 'Mode Terang' : 'Mode Gelap'}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                    <button onClick={handleLogout} disabled={loggingOut} className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        {loggingOut ? (
                            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Keluar...</span></>
                        ) : (
                            <><span>🚪</span><span>Logout</span></>
                        )}
                    </button>
                </div>
            </aside>

            <div className="ml-64 p-8">
                <div className="mb-8">
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Jadwal Sholat</h1>
                    <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Jadwal waktu sholat untuk Masjid Al-Ikhlas</p>
                </div>

                {/* Location Info Card */}
                <div className={`max-w-2xl mb-6 rounded-xl shadow-sm border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                                📍
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {prayerLocation || 'Bogor, Indonesia'}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {prayerSource === 'api' && '✅ Sumber: Aladhan API (Kemenag RI)'}
                                    {prayerSource === 'database' && '💾 Sumber: Database Lokal'}
                                    {prayerSource === 'default' && '⚙️ Sumber: Default'}
                                    {!prayerSource && 'Memuat sumber data...'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${darkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800'
                                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300'
                                } disabled:cursor-not-allowed`}
                        >
                            {refreshing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>Memperbarui...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔄</span>
                                    <span>Refresh dari API</span>
                                </>
                            )}
                        </button>
                    </div>
                    {prayerSource === 'api' && (
                        <div className={`mt-3 p-3 rounded-lg text-xs ${darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                            <strong>ℹ️ Info:</strong> Jadwal sholat diambil otomatis dari API Aladhan dengan metode perhitungan Kementerian Agama RI.
                            Anda hanya perlu mengatur waktu Sholat Jum&apos;at secara manual.
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    {success && (
                        <div className={`px-4 py-3 rounded-xl text-sm mb-6 flex items-center ${darkMode ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                            <span className="mr-2">✅</span>{success}
                        </div>
                    )}

                    {error && (
                        <div className={`px-4 py-3 rounded-xl text-sm mb-6 ${darkMode ? 'bg-red-900/30 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            {error}
                        </div>
                    )}

                    <div className={`rounded-xl shadow-sm border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="grid gap-6">
                            {prayerLabels.map(({ key, label, icon }) => (
                                <div key={key} className="flex items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4 ${nextPrayer === key ? 'bg-amber-500 text-white animate-pulse' : darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                        {icon}
                                    </div>
                                    <div className="flex-1">
                                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                            {label}
                                            {nextPrayer === key && <span className="ml-2 text-xs text-amber-500">(Berikutnya)</span>}
                                        </label>
                                        <input
                                            type="time"
                                            value={prayerTimes[key as keyof PrayerTimes] || ''}
                                            onChange={(e) => setPrayerTimes((prev) => ({ ...prev, [key]: e.target.value }))}
                                            required={key !== 'imsak'}
                                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-lg font-semibold ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-emerald-500' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                            <button type="submit" disabled={saving} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                {saving ? 'Menyimpan...' : 'Simpan Jadwal Sholat'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mt-8 max-w-2xl">
                    <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Preview Tampilan di Website</h2>
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                            🕐 Jadwal Sholat Hari Ini
                            <span className="text-xs font-normal px-2 py-1 bg-amber-500 rounded-full" suppressHydrationWarning>
                                {currentTime ? formatTime(currentTime) : '--:--:--'}
                            </span>
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {prayerLabels.slice(1, 7).map(({ key, label }) => (
                                <div key={key} className={`text-center p-3 rounded-lg transition-all ${nextPrayer === key ? 'bg-amber-500 shadow-lg scale-105' : 'bg-white/10'}`}>
                                    <p className={`text-xs ${nextPrayer === key ? 'text-amber-100' : 'text-emerald-100'}`}>{label}</p>
                                    <p className="text-xl font-bold">{prayerTimes[key as keyof PrayerTimes] || '--:--'}</p>
                                    {nextPrayer === key && <p className="text-xs text-amber-200 mt-1">Berikutnya</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
