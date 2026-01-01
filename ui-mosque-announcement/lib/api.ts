import axios, { AxiosError } from 'axios';
import { AnnouncementsResponse, AnnouncementDetailResponse } from '@/types/announcement';
import { LoginRequest, LoginResponse, LogoutResponse } from '@/types/auth';
import { PrayerTimesResponse } from '@/types/prayerTimes';

const API_BASE_URL = typeof window !== 'undefined'
    ? `${window.location.protocol}//masjid.test/api`
    : 'https://masjid.test/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface FetchAnnouncementsParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    search?: string;
    category?: string;
}

export async function fetchAnnouncements(
    params: FetchAnnouncementsParams = {},
    token?: string
): Promise<AnnouncementsResponse | null> {
    try {
        const {
            page = 1,
            per_page = 10,
            sort_by = 'created_at',
            sort_order = 'desc',
            search = '',
            category = '',
        } = params;

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.get<AnnouncementsResponse>('/announcements', {
            params: {
                page,
                per_page,
                sort_by,
                sort_order,
                search,
                category,
            },
            headers,
        });

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`API Error: ${error.response?.status} ${error.response?.statusText}`);
        } else {
            console.error('Failed to fetch announcements:', error);
        }
        return null;
    }
}

export async function fetchAnnouncementById(
    id: string
): Promise<AnnouncementDetailResponse | null> {
    try {
        const response = await api.get<AnnouncementDetailResponse>(`/announcements/${id}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`API Error: ${error.response?.status} ${error.response?.statusText}`);
        } else {
            console.error('Failed to fetch announcement:', error);
        }
        return null;
    }
}

export async function fetchPrayerTimes(): Promise<PrayerTimesResponse | null> {
    try {
        const response = await api.get<PrayerTimesResponse>('/prayer-times');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`API Error: ${error.response?.status} ${error.response?.statusText}`);
        } else {
            console.error('Failed to fetch prayer times:', error);
        }
        return null;
    }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await api.post<LoginResponse>('/login', credentials);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login gagal',
            };
        }
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function logout(token: string): Promise<LogoutResponse> {
    try {
        const response = await api.post<LogoutResponse>(
            '/logout',
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Logout gagal',
            };
        }
        console.error('Logout error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function createAnnouncement(
    data: FormData,
    token: string
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const response = await axios.post(`${API_BASE_URL}/announcements`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        return { success: true, data: response.data };
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal membuat pengumuman',
            };
        }
        console.error('Create announcement error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function updateAnnouncement(
    id: number,
    data: FormData,
    token: string
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/announcements/${id}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return { success: true, data: response.data };
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal memperbarui pengumuman',
            };
        }
        console.error('Update announcement error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function deleteAnnouncement(
    id: number,
    token: string
): Promise<{ success: boolean; message?: string }> {
    try {
        await axios.delete(`${API_BASE_URL}/announcements/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal menghapus pengumuman',
            };
        }
        console.error('Delete announcement error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function updatePrayerTimes(
    data: any,
    token: string
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const response = await axios.put(`${API_BASE_URL}/prayer-times`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return { success: true, data: response.data };
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal memperbarui jadwal sholat',
            };
        }
        console.error('Update prayer times error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}

export async function refreshPrayerTimes(
    token: string
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const response = await axios.post(`${API_BASE_URL}/prayer-times/refresh`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return { success: true, data: response.data };
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal memperbarui jadwal sholat dari API',
            };
        }
        console.error('Refresh prayer times error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        };
    }
}
