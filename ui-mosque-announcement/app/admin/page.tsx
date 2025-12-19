'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAnnouncements, deleteAnnouncement, logout } from '@/lib/api';
import { Announcement, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/announcement';
import { User } from '@/types/auth';
import MosqueAlert from '@/components/MosqueAlert';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
    });

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            router.push('/login');
            return;
        }

        // Check dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        loadAnnouncements();
    }, []);

    useEffect(() => {
        if (user) {
            loadAnnouncements();
        }
    }, [currentPage, searchQuery]);

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        const data = await fetchAnnouncements({
            page: currentPage,
            per_page: 10,
            search: searchQuery,
        });

        if (data && data.success) {
            setAnnouncements(data.data);
            setPagination(data.pagination);
            setCategories(data.categories || {});
        }
        setLoading(false);
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
                    } catch (e) {
                        // Continue with logout even if API call fails
                    }
                }

                // Clear all auth data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');

                // Show goodbye message
                MosqueAlert.logoutSuccess();

                // Redirect to login after delay
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            }
        );
    };

    const handleDelete = async (id: number, title: string) => {
        MosqueAlert.delete(title, async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push('/login');
                return;
            }

            const result = await deleteAnnouncement(id, token);
            if (result.success) {
                MosqueAlert.deleted('Pengumuman');
                loadAnnouncements();
            } else {
                MosqueAlert.error('Gagal Menghapus', result.message || 'Terjadi kesalahan saat menghapus pengumuman');
            }
        });
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

    const getCategoryStyle = (category: string) => {
        return CATEGORY_COLORS[category] || CATEGORY_COLORS.pengumuman;
    };

    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || '📢';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'short',
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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-emerald-800 to-emerald-900'} text-white`}>
                <div className="p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                            🕌
                        </div>
                        <div>
                            <h2 className="font-bold">Masjid Al-Ikhlas</h2>
                            <p className="text-emerald-200 text-xs">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Current Time */}
                <div className="px-6 py-4 bg-white/10">
                    <p className="text-xs text-emerald-200">Waktu Sekarang</p>
                    <p className="text-2xl font-bold clock-display">{formatTime(currentTime)}</p>
                </div>

                <nav className="mt-4">
                    <Link
                        href="/admin"
                        className="flex items-center px-6 py-3 bg-emerald-700/50 border-r-4 border-white"
                    >
                        <span className="mr-3">📋</span>
                        Pengumuman
                    </Link>
                    <Link
                        href="/admin/prayer-times"
                        className="flex items-center px-6 py-3 hover:bg-emerald-700/30 transition-colors"
                    >
                        <span className="mr-3">🕐</span>
                        Jadwal Sholat
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center px-6 py-3 hover:bg-emerald-700/30 transition-colors"
                    >
                        <span className="mr-3">🌐</span>
                        Lihat Website
                    </Link>
                </nav>

                {/* User Info & Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name}</p>
                            <p className="text-emerald-200 text-xs truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg"
                            title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loggingOut ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Keluar...</span>
                            </>
                        ) : (
                            <>
                                <span>🚪</span>
                                <span>Logout</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Kelola Pengumuman</h1>
                        <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Tambah, edit, atau hapus pengumuman masjid</p>
                    </div>
                    <Link
                        href="/admin/announcements/create"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        <span className="mr-2">➕</span>
                        Buat Pengumuman
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className={`rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Pengumuman</p>
                                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pagination.total}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                📢
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aktif</p>
                                <p className="text-3xl font-bold text-emerald-500">
                                    {announcements.filter(a => a.is_active).length}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                ✅
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Tidak Aktif</p>
                                <p className={`text-3xl font-bold ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                                    {announcements.filter(a => !a.is_active).length}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                ⏸️
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Kategori</p>
                                <p className="text-3xl font-bold text-amber-500">
                                    {Object.keys(categories).length}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
                                🏷️
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className={`rounded-xl shadow-sm border p-4 mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari pengumuman..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={`w-full pl-12 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-200 transition-all outline-none ${darkMode
                                ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'
                                }`}
                        />
                        <svg
                            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}
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

                {/* Announcements Table */}
                <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className={`mt-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Memuat data...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                Belum Ada Pengumuman
                            </h3>
                            <p className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                Mulai dengan membuat pengumuman pertama
                            </p>
                            <Link
                                href="/admin/announcements/create"
                                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                            >
                                Buat Pengumuman
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className={`border-b ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-100'}`}>
                                <tr>
                                    <th className={`text-left px-6 py-4 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Judul</th>
                                    <th className={`text-left px-6 py-4 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Kategori</th>
                                    <th className={`text-left px-6 py-4 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Tanggal</th>
                                    <th className={`text-left px-6 py-4 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
                                    <th className={`text-right px-6 py-4 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((announcement) => (
                                    <tr key={announcement.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4">
                                            <p className={`font-medium truncate max-w-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {announcement.title}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`category-badge ${getCategoryStyle(announcement.category).bg} ${getCategoryStyle(announcement.category).text}`}
                                            >
                                                <span>{getCategoryIcon(announcement.category)}</span>
                                                {categories[announcement.category] || 'Pengumuman'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {formatDate(announcement.publish_at || announcement.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {announcement.is_active ? (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                                                    Tidak Aktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={`/admin/announcements/${announcement.id}/edit`}
                                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-900/50 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(announcement.id, announcement.title)}
                                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                                                    title="Hapus"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {!loading && pagination.last_page > 1 && (
                        <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                Menampilkan {pagination.from} - {pagination.to} dari {pagination.total}
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${darkMode
                                        ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                                        : 'bg-white border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                    disabled={currentPage === pagination.last_page}
                                    className={`px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${darkMode
                                        ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                                        : 'bg-white border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
