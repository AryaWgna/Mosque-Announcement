'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchAnnouncementById, updateAnnouncement, fetchAnnouncements, logout } from '@/lib/api';
import { CATEGORY_ICONS } from '@/types/announcement';
import { User } from '@/types/auth';
import MosqueAlert from '@/components/MosqueAlert';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function EditAnnouncementPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('pengumuman');
    const [publishAt, setPublishAt] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [existingVideo, setExistingVideo] = useState<string | null>(null);
    const [existingMediaType, setExistingMediaType] = useState<string>('none');
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [user, setUser] = useState<User | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const loadAnnouncement = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        const data = await fetchAnnouncementById(id);

        if (data && data.success) {
            setTitle(data.data.title);
            setContent(data.data.content);
            setCategory(data.data.category);
            setIsActive(data.data.is_active);

            if (data.data.publish_at) {
                const date = new Date(data.data.publish_at);
                setPublishAt(date.toISOString().slice(0, 16));
            }

            if (data.data.image_path) {
                setExistingImage(data.data.image_path);
                setMediaType('image');
                setExistingMediaType('image');
            }

            if (data.data.video_path) {
                setExistingVideo(data.data.video_path);
                setMediaType('video');
                setExistingMediaType('video');
            }

            if (data.data.media_type) {
                setMediaType(data.data.media_type);
                setExistingMediaType(data.data.media_type);
            }
        } else {
            setError('Gagal memuat data pengumuman');
        }

        setLoading(false);
    }, [id]);

    const loadCategories = useCallback(async () => {
        const data = await fetchAnnouncements({ per_page: 1 });
        if (data && data.categories) {
            setCategories(data.categories);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user');
        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                // ignore
            }
        }

        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        loadAnnouncement();
        loadCategories();
    }, [router, loadAnnouncement, loadCategories]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setVideo(null);
            setVideoPreview(null);
            setExistingVideo(null);
            setMediaType('image');
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) {
                MosqueAlert.error('File Terlalu Besar', 'Ukuran video maksimal 100MB');
                return;
            }
            setVideo(file);
            setImage(null);
            setImagePreview(null);
            setExistingImage(null);
            setMediaType('video');
            const url = URL.createObjectURL(file);
            setVideoPreview(url);
        }
    };

    const clearMedia = () => {
        setImage(null);
        setImagePreview(null);
        setVideo(null);
        setVideoPreview(null);
        setExistingImage(null);
        setExistingVideo(null);
        setMediaType('none');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        formData.append('is_active', isActive ? '1' : '0');

        if (publishAt) {
            formData.append('publish_at', publishAt);
        }

        if (image) {
            formData.append('image', image);
        }

        if (video) {
            formData.append('video', video);
        }

        // If media was cleared
        if (mediaType === 'none' && (existingMediaType === 'image' || existingMediaType === 'video')) {
            formData.append('remove_media', '1');
        }

        const result = await updateAnnouncement(parseInt(id), formData, token);

        if (result.success) {
            MosqueAlert.success('Berhasil Diperbarui! 🎉', 'Pengumuman telah berhasil diperbarui.');
            setTimeout(() => {
                router.push('/admin');
            }, 1500);
        } else {
            MosqueAlert.error('Gagal Memperbarui', result.message || 'Terjadi kesalahan saat memperbarui pengumuman');
            setError(result.message || 'Gagal memperbarui pengumuman');
        }

        setSaving(false);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
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
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                MosqueAlert.logoutSuccess();
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            }
        );
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean'],
        ],
    };

    const getMediaUrl = (path: string) => {
        return `${window.location.protocol}//masjid.test/storage/${path}`;
    };

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
                    <p className="text-2xl font-bold clock-display">{formatTime(currentTime)}</p>
                </div>

                <nav className="mt-4">
                    <Link href="/admin" className="flex items-center px-6 py-3 bg-emerald-700/50 border-r-4 border-white">
                        <span className="mr-3">📋</span>Pengumuman
                    </Link>
                    <Link href="/admin/prayer-times" className="flex items-center px-6 py-3 hover:bg-emerald-700/30 transition-colors">
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

            <div className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-2 inline-block">
                            ← Kembali ke Daftar Pengumuman
                        </Link>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Pengumuman</h1>
                        <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Perbarui informasi pengumuman</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-4xl">
                    {error && (
                        <div className={`px-4 py-3 rounded-xl text-sm mb-6 flex items-center ${darkMode ? 'bg-red-900/30 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            <span className="mr-2">❌</span>
                            {error}
                        </div>
                    )}

                    <div className={`rounded-xl shadow-sm border p-6 space-y-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                Judul Pengumuman <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Contoh: Jadwal Sholat Jumat Bulan Ini"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-200 transition-all outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500'}`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(categories).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setCategory(key)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${category === key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-md' : darkMode ? 'border-slate-600 hover:border-slate-500 bg-slate-700' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                    >
                                        <span className="text-2xl">{CATEGORY_ICONS[key] || '📢'}</span>
                                        <p className={`text-sm font-medium mt-2 ${category === key ? 'text-emerald-700 dark:text-emerald-300' : darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                Isi Pengumuman <span className="text-red-500">*</span>
                            </label>
                            <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} placeholder="Tulis isi pengumuman di sini..." className="bg-white rounded-xl" />
                        </div>

                        {/* Media Upload - Image or Video */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                Media (Gambar atau Video)
                            </label>

                            {/* Media Type Selector */}
                            <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { if (!existingImage && !image) { clearMedia(); setMediaType('image'); } else { setMediaType('image'); } }}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${mediaType === 'image' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <span className="text-xl">📷</span>
                                    <span className={darkMode ? 'text-white' : 'text-gray-700'}>Gambar</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (!existingVideo && !video) { clearMedia(); setMediaType('video'); } else { setMediaType('video'); } }}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${mediaType === 'video' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <span className="text-xl">🎬</span>
                                    <span className={darkMode ? 'text-white' : 'text-gray-700'}>Video</span>
                                </button>
                            </div>

                            {/* Image Upload */}
                            {mediaType === 'image' && (
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    {imagePreview ? (
                                        <div className="relative inline-block">
                                            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg shadow-lg" />
                                            <button type="button" onClick={clearMedia} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">✕</button>
                                        </div>
                                    ) : existingImage ? (
                                        <div className="relative inline-block">
                                            <img src={getMediaUrl(existingImage)} alt="Current" className="max-h-48 rounded-lg shadow-lg" />
                                            <button type="button" onClick={clearMedia} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">✕</button>
                                            <p className={`text-sm mt-3 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gambar saat ini</p>
                                            <label className={`cursor-pointer mt-2 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                Ganti Gambar
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="text-5xl mb-3">📷</div>
                                            <p className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Klik untuk upload gambar</p>
                                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>PNG, JPG, GIF, WEBP (Maks 5MB)</p>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Video Upload */}
                            {mediaType === 'video' && (
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                    {videoPreview ? (
                                        <div className="relative inline-block">
                                            <video src={videoPreview} controls className="max-h-64 rounded-lg shadow-lg" />
                                            <button type="button" onClick={clearMedia} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">✕</button>
                                        </div>
                                    ) : existingVideo ? (
                                        <div className="relative inline-block">
                                            <video src={getMediaUrl(existingVideo)} controls className="max-h-64 rounded-lg shadow-lg" />
                                            <button type="button" onClick={clearMedia} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">✕</button>
                                            <p className={`text-sm mt-3 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Video saat ini</p>
                                            <label className={`cursor-pointer mt-2 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                Ganti Video
                                                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="text-5xl mb-3">🎬</div>
                                            <p className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Klik untuk upload video</p>
                                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>MP4, WebM, OGG, MOV (Maks 100MB)</p>
                                            <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Tanggal Publikasi (Opsional)</label>
                            <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Kosongkan untuk publikasi langsung</p>
                            <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-200 transition-all outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-emerald-500' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'}`} />
                        </div>

                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <div className="ml-3">
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aktifkan Pengumuman</span>
                                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pengumuman akan langsung tampil di website jika diaktifkan</p>
                                </div>
                            </label>
                        </div>

                        <div className={`flex items-center justify-end space-x-4 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                            <Link href="/admin" className={`px-6 py-3 rounded-xl border transition-colors font-medium ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Batal</Link>
                            <button type="submit" disabled={saving} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                                {saving ? (
                                    <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</>
                                ) : (
                                    <><span className="mr-2">💾</span>Perbarui Pengumuman</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
