export interface PrayerTimes {
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    jumat: string;
    imsak?: string;
    sunrise?: string;
}

export interface PrayerTimesResponse {
    success: boolean;
    data: PrayerTimes;
    source?: 'api' | 'myquran' | 'aladhan' | 'database' | 'default';
    jumat_source?: 'auto' | 'manual';
    location?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    date?: string;
}
