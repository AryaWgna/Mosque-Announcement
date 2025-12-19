'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAnnouncementById } from '@/lib/api';
import { Announcement, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/announcement';

export default function AnnouncementPage() {
    const params = useParams();
    const id = params?.id as string;

    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const loadAnnouncement = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError(false);

        const data = await fetchAnnouncementById(id);

        if (data && data.success) {
            setAnnouncement(data.data);
            setCategories(data.categories || {});
        } else {
            setError(true);
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        loadAnnouncement();
    }, [loadAnnouncement]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getCategoryStyle = (category: string) => {
        return CATEGORY_COLORS[category] || CATEGORY_COLORS.pengumuman;
    };

    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || '📢';
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

    const getMediaUrl = (path: string) => {
        return `${window.location.protocol}//masjid.test/storage/${path}`;
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'} islamic-pattern`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className={`rounded-2xl p-8 shadow-lg animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`h-8 rounded w-3/4 mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                        <div className={`h-4 rounded w-1/4 mb-8 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                        <div className="space-y-3">
                            <div className={`h-4 rounded w-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                            <div className={`h-4 rounded w-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                            <div className={`h-4 rounded w-5/6 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !announcement) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'} islamic-pattern`}>
                <div className={`rounded-2xl p-12 text-center shadow-lg max-w-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Pengumuman Tidak Ditemukan
                    </h2>
                    <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Pengumuman yang Anda cari tidak tersedia atau telah dihapus.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'} islamic-pattern`}>
            <header className="mosque-header text-white">
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-emerald-100 hover:text-white transition-colors">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                    <button
                        onClick={toggleDarkMode}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                        title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <article className={`rounded-2xl shadow-xl overflow-hidden animate-fadeIn ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    {/* Image */}
                    {announcement.media_type === 'image' && announcement.image_path && (
                        <div className="relative h-64 md:h-96 bg-gray-100">
                            <img
                                src={getMediaUrl(announcement.image_path)}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                    )}

                    {/* Video */}
                    {announcement.media_type === 'video' && announcement.video_path && (
                        <div className="relative bg-black">
                            <video
                                src={getMediaUrl(announcement.video_path)}
                                controls
                                className="w-full max-h-[500px]"
                                poster=""
                            >
                                Browser Anda tidak mendukung video.
                            </video>
                        </div>
                    )}

                    {/* Legacy support - if no media_type but has image_path */}
                    {!announcement.media_type && announcement.image_path && (
                        <div className="relative h-64 md:h-96 bg-gray-100">
                            <img
                                src={getMediaUrl(announcement.image_path)}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                    )}

                    <div className="p-8">
                        <span className={`category-badge mb-4 ${getCategoryStyle(announcement.category).bg} ${getCategoryStyle(announcement.category).text}`}>
                            <span>{getCategoryIcon(announcement.category)}</span>
                            {categories[announcement.category] || 'Pengumuman'}
                        </span>

                        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {announcement.title}
                        </h1>

                        <div className={`flex flex-wrap items-center gap-4 text-sm mb-8 pb-8 border-b ${darkMode ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>
                            <span className="flex items-center">
                                <svg className={`w-4 h-4 mr-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(announcement.publish_at || announcement.created_at)}
                            </span>
                            {announcement.is_active && (
                                <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                    Aktif
                                </span>
                            )}
                            {announcement.media_type === 'video' && (
                                <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                    🎬 Video
                                </span>
                            )}
                        </div>

                        <div className="prose-content" dangerouslySetInnerHTML={{ __html: announcement.content }} />
                    </div>
                </article>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                </div>
            </main>

            <footer className={`py-8 mt-16 ${darkMode ? 'bg-slate-800' : 'bg-emerald-900'} text-white`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-3xl mb-4">🕌</div>
                    <h3 className="text-xl font-bold mb-2">Masjid Al-Ikhlas</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-emerald-300'}`}>
                        © {new Date().getFullYear()} - Dibuat dengan ❤️ untuk umat
                    </p>
                </div>
            </footer>
        </div>
    );
}
