'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAnnouncements, fetchPrayerTimes } from '@/lib/api';
import { Announcement, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/announcement';
import { PrayerTimes } from '@/types/prayerTimes';

export default function Home() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [nextPrayer, setNextPrayer] = useState<string>('');
    const [darkMode, setDarkMode] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Mark as client-side rendered
    useEffect(() => {
        setIsClient(true);
        setCurrentTime(new Date());
    }, []);

    // Initialize dark mode from localStorage
    useEffect(() => {
        if (!isClient) return;

        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        const token = localStorage.getItem('auth_token');
        setIsLoggedIn(!!token);
    }, [isClient]);

    // Update dark mode class on html element
    useEffect(() => {
        if (!isClient) return;

        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode, isClient]);

    // Real-time clock update
    useEffect(() => {
        if (!isClient) return;

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [isClient]);

    // Calculate next prayer
    useEffect(() => {
        if (prayerTimes && currentTime) {
            calculateNextPrayer();
        }
    }, [currentTime, prayerTimes]);

    const calculateNextPrayer = () => {
        if (!prayerTimes || !currentTime) return;

        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const prayers = [
            { name: 'subuh', time: prayerTimes.subuh },
            { name: 'dzuhur', time: prayerTimes.dzuhur },
            { name: 'ashar', time: prayerTimes.ashar },
            { name: 'maghrib', time: prayerTimes.maghrib },
            { name: 'isya', time: prayerTimes.isya },
        ];

        for (const prayer of prayers) {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerMinutes = hours * 60 + minutes;

            if (prayerMinutes > currentMinutes) {
                setNextPrayer(prayer.name);
                return;
            }
        }

        setNextPrayer('subuh');
    };

    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        loadAnnouncements();
    }, [currentPage, searchQuery, selectedCategory]);

    useEffect(() => {
        loadPrayerTimes();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        setError(false);

        const data = await fetchAnnouncements({
            page: currentPage,
            per_page: 10,
            sort_by: 'created_at',
            sort_order: 'desc',
            search: searchQuery,
            category: selectedCategory,
        });

        if (data && data.success) {
            setAnnouncements(data.data);
            setPagination(data.pagination);
            setCategories(data.categories || {});
        } else {
            setError(true);
        }

        setLoading(false);
    };

    const loadPrayerTimes = async () => {
        const data = await fetchPrayerTimes();
        if (data && data.success) {
            setPrayerTimes(data.data);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatFullDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getCategoryStyle = (category: string) => {
        return CATEGORY_COLORS[category] || CATEGORY_COLORS.pengumuman;
    };

    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || '📢';
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'} islamic-pattern`}>
            {/* Header */}
            <header className="mosque-header text-white">
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                                🕌
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Masjid Al-Ikhlas
                                </h1>
                                <p className="text-emerald-100 mt-1">
                                    Sistem Pengumuman Digital
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="dark-mode-toggle bg-white/20 hover:bg-white/30"
                                title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>

                            {/* Login/Admin Button */}
                            {isClient && isLoggedIn ? (
                                <Link
                                    href="/admin"
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-300"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-300"
                                >
                                    Admin Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Current Time Display - Only render on client */}
                {isClient && currentTime && (
                    <div className="mb-8 text-center animate-fadeIn">
                        <div className={`inline-block px-8 py-6 rounded-2xl shadow-xl ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-emerald-200'}`}>
                            <p className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {formatFullDate(currentTime)}
                            </p>
                            <p className="text-5xl font-bold gradient-text clock-display animate-clock-tick">
                                {formatTime(currentTime)}
                            </p>
                            <p className={`text-sm mt-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Waktu Indonesia Barat (WIB)
                            </p>
                        </div>
                    </div>
                )}

                {/* Prayer Times Section */}
                {prayerTimes && (
                    <div className="mb-8 animate-fadeIn">
                        <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                            🕐 Jadwal Sholat Hari Ini
                            {nextPrayer && (
                                <span className={`text-sm font-normal px-3 py-1 rounded-full ${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                    Sholat berikutnya: {nextPrayer.charAt(0).toUpperCase() + nextPrayer.slice(1)}
                                </span>
                            )}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {[
                                { name: 'Subuh', key: 'subuh', time: prayerTimes.subuh },
                                { name: 'Dzuhur', key: 'dzuhur', time: prayerTimes.dzuhur },
                                { name: 'Ashar', key: 'ashar', time: prayerTimes.ashar },
                                { name: 'Maghrib', key: 'maghrib', time: prayerTimes.maghrib },
                                { name: 'Isya', key: 'isya', time: prayerTimes.isya },
                                { name: "Jum'at", key: 'jumat', time: prayerTimes.jumat },
                            ].map((prayer) => (
                                <div
                                    key={prayer.key}
                                    className={`prayer-card ${nextPrayer === prayer.key ? 'next-prayer active' : ''}`}
                                >
                                    <p className="text-emerald-100 text-sm">{prayer.name}</p>
                                    <p className="text-2xl font-bold">{prayer.time}</p>
                                    {nextPrayer === prayer.key && (
                                        <p className="text-xs mt-1 text-amber-200">Berikutnya</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Filter */}
                <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setCurrentPage(1);
                            }}
                            className={`category-badge ${selectedCategory === ''
                                ? 'bg-emerald-600 text-white'
                                : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        {Object.entries(categories).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedCategory(key);
                                    setCurrentPage(1);
                                }}
                                className={`category-badge ${selectedCategory === key
                                    ? `${getCategoryStyle(key).bg} ${getCategoryStyle(key).text}`
                                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <span>{getCategoryIcon(key)}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="relative max-w-2xl">
                        <input
                            type="text"
                            placeholder="Cari pengumuman..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={`w-full px-6 py-4 rounded-2xl border-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-lg transition-all duration-300 ${darkMode
                                ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400'
                                : 'bg-white border-emerald-200 text-gray-900 placeholder:text-gray-400'
                                }`}
                        />
                        <svg
                            className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`rounded-2xl p-6 shadow-lg animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
                            >
                                <div className={`h-6 rounded w-3/4 mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-4 rounded w-full mb-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                                <div className={`h-4 rounded w-5/6 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className={`rounded-2xl p-8 text-center ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                            Gagal Memuat Pengumuman
                        </h3>
                        <p className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                            Tidak dapat terhubung ke server. Silakan coba lagi nanti.
                        </p>
                        <button
                            onClick={loadAnnouncements}
                            className="btn-primary"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Announcements Grid */}
                {!loading && !error && announcements.length > 0 && (
                    <div className="space-y-6">
                        {announcements.map((announcement, index) => (
                            <div
                                key={announcement.id}
                                className={`group rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 hover:border-emerald-300 animate-fadeIn ${darkMode
                                    ? 'bg-slate-800 border-slate-700'
                                    : 'bg-white border-transparent'
                                    }`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        {/* Category Badge */}
                                        <span
                                            className={`category-badge mb-3 ${getCategoryStyle(announcement.category).bg} ${getCategoryStyle(announcement.category).text}`}
                                        >
                                            <span>{getCategoryIcon(announcement.category)}</span>
                                            {categories[announcement.category] || 'Pengumuman'}
                                        </span>

                                        <h2 className={`text-2xl font-bold mb-2 group-hover:text-emerald-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {announcement.title}
                                        </h2>
                                        <div className={`flex items-center space-x-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            <span className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                {formatDate(announcement.publish_at || announcement.created_at)}
                                            </span>
                                            {announcement.is_active && (
                                                <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/announcements/${announcement.id}`}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    Baca Selengkapnya
                                    <svg
                                        className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && announcements.length === 0 && (
                    <div className={`rounded-2xl p-12 text-center shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                            Tidak Ada Pengumuman
                        </h3>
                        <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                            {searchQuery
                                ? 'Coba sesuaikan kata kunci pencarian Anda'
                                : 'Belum ada pengumuman saat ini'}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && pagination.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${darkMode
                                ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 text-white'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Sebelumnya
                        </button>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === pagination.last_page ||
                                        Math.abs(page - currentPage) <= 1
                                )
                                .map((page, index, array) => (
                                    <div key={page} className="flex items-center">
                                        {index > 0 && array[index - 1] !== page - 1 && (
                                            <span className={`px-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
                                                : darkMode
                                                    ? 'bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                ))}
                        </div>

                        <button
                            onClick={() =>
                                setCurrentPage(Math.min(pagination.last_page, currentPage + 1))
                            }
                            disabled={currentPage === pagination.last_page}
                            className={`px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${darkMode
                                ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 text-white'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}

                {/* Stats */}
                {!loading && !error && announcements.length > 0 && (
                    <div className={`mt-6 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Menampilkan {pagination.from} - {pagination.to} dari {pagination.total}{' '}
                        pengumuman
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className={`py-8 mt-16 ${darkMode ? 'bg-slate-800' : 'bg-emerald-900'} text-white`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-3xl mb-4">🕌</div>
                    <h3 className="text-xl font-bold mb-2">Masjid Al-Ikhlas</h3>
                    <p className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-emerald-200'}`}>
                        Sistem Pengumuman Digital
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-emerald-300'}`}>
                        © 2024 - Dibuat dengan ❤️ untuk umat
                    </p>
                </div>
            </footer>
        </div>
    );
}
