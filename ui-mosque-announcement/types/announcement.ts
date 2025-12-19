export interface Announcement {
    id: number;
    title: string;
    content: string;
    category: string;
    image_path: string | null;
    video_path: string | null;
    media_type: 'none' | 'image' | 'video';
    publish_at: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

export interface AnnouncementsResponse {
    success: boolean;
    data: Announcement[];
    pagination: PaginationMeta;
    categories: Record<string, string>;
}

export interface AnnouncementDetailResponse {
    success: boolean;
    data: Announcement;
    categories: Record<string, string>;
}

export interface Category {
    key: string;
    label: string;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    pengumuman: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    jadwal_sholat: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    kajian: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    ramadhan: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    zakat: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    kegiatan: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
    donasi: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    penting: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export const CATEGORY_ICONS: Record<string, string> = {
    pengumuman: '📢',
    jadwal_sholat: '🕌',
    kajian: '📖',
    ramadhan: '🌙',
    zakat: '💝',
    kegiatan: '🎉',
    donasi: '💰',
    penting: '⚠️',
};
