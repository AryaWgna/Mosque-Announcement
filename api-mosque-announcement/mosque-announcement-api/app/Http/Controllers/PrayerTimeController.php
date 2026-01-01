<?php

namespace App\Http\Controllers;

use App\Models\PrayerTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PrayerTimeController extends Controller
{
    // Bogor, Indonesia coordinates
    private const BOGOR_LATITUDE = -6.5971;
    private const BOGOR_LONGITUDE = 106.8060;
    private const TIMEZONE = 'Asia/Jakarta';

    // Aladhan API method (Kementerian Agama RI - method 20)
    private const CALCULATION_METHOD = 20;

    /**
     * Display the prayer times.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // Try to get prayer times from external API (cached for 1 hour)
        $prayerTimesFromApi = $this->fetchPrayerTimesFromApi();

        if ($prayerTimesFromApi) {
            // Also fetch custom data from database (for Jumat time which is usually custom)
            $customTimes = PrayerTime::first();

            return response()->json([
                'success' => true,
                'data' => [
                    'subuh' => $prayerTimesFromApi['subuh'],
                    'dzuhur' => $prayerTimesFromApi['dzuhur'],
                    'ashar' => $prayerTimesFromApi['ashar'],
                    'maghrib' => $prayerTimesFromApi['maghrib'],
                    'isya' => $prayerTimesFromApi['isya'],
                    'jumat' => $customTimes?->jumat ?? '11:30',
                    'imsak' => $prayerTimesFromApi['imsak'],
                ],
                'source' => 'api',
                'location' => 'Bogor, Indonesia',
                'coordinates' => [
                    'latitude' => self::BOGOR_LATITUDE,
                    'longitude' => self::BOGOR_LONGITUDE,
                ],
                'date' => now()->format('Y-m-d'),
            ], 200);
        }

        // Fallback to database or default values
        $prayerTimes = PrayerTime::first();

        if (!$prayerTimes) {
            // Return default times if not set
            return response()->json([
                'success' => true,
                'data' => [
                    'subuh' => '04:30',
                    'dzuhur' => '12:00',
                    'ashar' => '15:15',
                    'maghrib' => '18:00',
                    'isya' => '19:15',
                    'jumat' => '11:30',
                    'imsak' => '04:20',
                ],
                'source' => 'default',
                'location' => 'Bogor, Indonesia',
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => $prayerTimes,
            'source' => 'database',
            'location' => 'Bogor, Indonesia',
        ], 200);
    }

    /**
     * Fetch prayer times from Aladhan API for Bogor, Indonesia.
     *
     * @return array|null
     */
    private function fetchPrayerTimesFromApi(): ?array
    {
        $cacheKey = 'prayer_times_bogor_' . now()->format('Y-m-d');

        // Check cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::timeout(10)->get('https://api.aladhan.com/v1/timings', [
                'latitude' => self::BOGOR_LATITUDE,
                'longitude' => self::BOGOR_LONGITUDE,
                'method' => self::CALCULATION_METHOD,
                'timezone' => self::TIMEZONE,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['data']['timings'])) {
                    $timings = $data['data']['timings'];

                    $prayerTimes = [
                        'subuh' => $this->formatTimeFromApi($timings['Fajr'] ?? '04:30'),
                        'dzuhur' => $this->formatTimeFromApi($timings['Dhuhr'] ?? '12:00'),
                        'ashar' => $this->formatTimeFromApi($timings['Asr'] ?? '15:15'),
                        'maghrib' => $this->formatTimeFromApi($timings['Maghrib'] ?? '18:00'),
                        'isya' => $this->formatTimeFromApi($timings['Isha'] ?? '19:15'),
                        'imsak' => $this->formatTimeFromApi($timings['Imsak'] ?? '04:20'),
                        'sunrise' => $this->formatTimeFromApi($timings['Sunrise'] ?? '06:00'),
                    ];

                    // Cache for 1 hour (or until next day)
                    $minutesUntilMidnight = now()->diffInMinutes(now()->endOfDay());
                    $cacheDuration = min(60, $minutesUntilMidnight);

                    Cache::put($cacheKey, $prayerTimes, now()->addMinutes($cacheDuration));

                    return $prayerTimes;
                }
            }

            Log::warning('Failed to fetch prayer times from Aladhan API', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching prayer times from API', [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Format time from API response (removes timezone suffix like "(WIB)")
     *
     * @param string $time
     * @return string
     */
    private function formatTimeFromApi(string $time): string
    {
        // Remove timezone suffix like " (WIB)" if present
        $time = preg_replace('/\s*\([^)]+\)/', '', $time);
        return trim($time);
    }

    /**
     * Update the prayer times (mainly for Jumat time).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'subuh' => 'nullable|date_format:H:i',
            'dzuhur' => 'nullable|date_format:H:i',
            'ashar' => 'nullable|date_format:H:i',
            'maghrib' => 'nullable|date_format:H:i',
            'isya' => 'nullable|date_format:H:i',
            'jumat' => 'required|date_format:H:i',
            'imsak' => 'nullable|date_format:H:i',
        ]);

        $prayerTimes = PrayerTime::first();

        if (!$prayerTimes) {
            $prayerTimes = PrayerTime::create([
                ...$validated,
                'updated_by' => $request->user()->id,
            ]);
        } else {
            $prayerTimes->update([
                ...$validated,
                'updated_by' => $request->user()->id,
            ]);
        }

        // Clear cache when prayer times are updated
        Cache::forget('prayer_times_bogor_' . now()->format('Y-m-d'));

        return response()->json([
            'success' => true,
            'message' => 'Jadwal sholat berhasil diperbarui',
            'data' => $prayerTimes
        ], 200);
    }

    /**
     * Force refresh prayer times from API.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        // Clear cache
        Cache::forget('prayer_times_bogor_' . now()->format('Y-m-d'));

        // Fetch fresh data
        return $this->index();
    }
}
