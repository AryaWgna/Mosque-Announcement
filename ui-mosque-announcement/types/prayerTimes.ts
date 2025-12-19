export interface PrayerTimes {
    subuh: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
    jumat: string;
    imsak?: string;
}

export interface PrayerTimesResponse {
    success: boolean;
    data: PrayerTimes;
}
