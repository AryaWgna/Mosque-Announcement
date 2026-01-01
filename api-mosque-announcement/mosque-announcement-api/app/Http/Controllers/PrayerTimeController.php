<?php

namespace App\Http\Controllers;

use App\Models\PrayerTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PrayerTimeController extends Controller
{
    // Kota Bogor, Indonesia - ID untuk API MyQuran.com
    // Daftar lengkap kota: https://api.myquran.com/v2/sholat/kota/semua
    private const BOGOR_CITY_ID = 1301;

    // Koordinat Kota Bogor (Tanah Sereal area) untuk fallback ke Aladhan API
    private const BOGOR_LATITUDE = -6.5944;
    private const BOGOR_LONGITUDE = 106.7892;
    private const TIMEZONE = 'Asia/Jakarta';

    // Aladhan API method (Kementerian Agama RI - method 20)
    private const CALCULATION_METHOD = 20;

    // Waktu Jum'at default: 30 menit sebelum Dzuhur
    // Ini adalah standar umum di masjid Indonesia (untuk khutbah)
    private const JUMAT_MINUTES_BEFORE_DZUHUR = 30;

    /**
     * Display the prayer times.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // Try to get prayer times from external API (cached until midnight)
        $prayerTimesFromApi = $this->fetchPrayerTimesFromApi();

        if ($prayerTimesFromApi) {
            // Check if admin has set custom Jumat time in database
            $customTimes = PrayerTime::first();

            // Calculate automatic Jumat time (30 minutes before Dzuhur)
            $autoJumatTime = $this->calculateJumatTime($prayerTimesFromApi['dzuhur']);

            // Use custom Jumat time if set by admin, otherwise use auto-calculated time
            $jumatTime = $customTimes?->jumat ?? $autoJumatTime;

            // Determine if Jumat time is auto or manual
            $jumatSource = $customTimes?->jumat ? 'manual' : 'auto';

            return response()->json([
                'success' => true,
                'data' => [
                    'subuh' => $prayerTimesFromApi['subuh'],
                    'dzuhur' => $prayerTimesFromApi['dzuhur'],
                    'ashar' => $prayerTimesFromApi['ashar'],
                    'maghrib' => $prayerTimesFromApi['maghrib'],
                    'isya' => $prayerTimesFromApi['isya'],
                    'jumat' => $jumatTime,
                    'imsak' => $prayerTimesFromApi['imsak'],
                ],
                'source' => $prayerTimesFromApi['source'] ?? 'api',
                'jumat_source' => $jumatSource,
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
            // Waktu default berdasarkan jadwal Kota Bogor (Kemenag RI)
            return response()->json([
                'success' => true,
                'data' => [
                    'subuh' => '04:19',
                    'dzuhur' => '12:00',
                    'ashar' => '15:26',
                    'maghrib' => '18:19',
                    'isya' => '19:28',
                    'jumat' => '11:30', // 30 menit sebelum Dzuhur 12:00
                    'imsak' => '04:09',
                ],
                'source' => 'default',
                'jumat_source' => 'auto',
                'location' => 'Bogor, Indonesia',
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => $prayerTimes,
            'source' => 'database',
            'jumat_source' => 'manual',
            'location' => 'Bogor, Indonesia',
        ], 200);
    }

    /**
     * Calculate Jumat prayer time (30 minutes before Dzuhur)
     *
     * @param string $dzuhurTime Format HH:MM
     * @return string
     */
    private function calculateJumatTime(string $dzuhurTime): string
    {
        try {
            // Parse Dzuhur time
            $dzuhur = Carbon::createFromFormat('H:i', $dzuhurTime);

            // Subtract 30 minutes for Jumat time
            $jumat = $dzuhur->subMinutes(self::JUMAT_MINUTES_BEFORE_DZUHUR);

            return $jumat->format('H:i');
        } catch (\Exception $e) {
            // Fallback to default if parsing fails
            Log::warning('Failed to calculate Jumat time', [
                'dzuhur' => $dzuhurTime,
                'error' => $e->getMessage(),
            ]);
            return '11:30';
        }
    }

    /**
     * Fetch prayer times from API.
     * Primary: MyQuran.com API (Indonesian API, more reliable)
     * Fallback: Aladhan API
     *
     * @return array|null
     */
    private function fetchPrayerTimesFromApi(): ?array
    {
        $today = now()->format('Y-m-d');
        $cacheKey = 'prayer_times_bogor_' . $today;

        // Check cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Try MyQuran.com API first (Indonesian API, faster & more reliable)
        $prayerTimes = $this->fetchFromMyQuran();

        // If MyQuran fails, try Aladhan API
        if (!$prayerTimes) {
            $prayerTimes = $this->fetchFromAladhan();
        }

        if ($prayerTimes) {
            // Cache until midnight (so it refreshes for the next day)
            $minutesUntilMidnight = now()->diffInMinutes(now()->endOfDay());
            Cache::put($cacheKey, $prayerTimes, now()->addMinutes($minutesUntilMidnight));

            Log::info('Prayer times fetched successfully', [
                'source' => $prayerTimes['source'],
                'date' => $today,
            ]);
        }

        return $prayerTimes;
    }

    /**
     * Fetch prayer times from MyQuran.com API
     * API Docs: https://api.myquran.com/
     * City ID 1301 = Kota Bogor
     *
     * @return array|null
     */
    private function fetchFromMyQuran(): ?array
    {
        try {
            $today = now();
            $url = sprintf(
                'https://api.myquran.com/v2/sholat/jadwal/%d/%d/%02d/%02d',
                self::BOGOR_CITY_ID,
                $today->year,
                $today->month,
                $today->day
            );

            $response = Http::timeout(15)->get($url);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['status']) && $data['status'] === true && isset($data['data']['jadwal'])) {
                    $jadwal = $data['data']['jadwal'];

                    return [
                        'subuh' => $jadwal['subuh'] ?? '04:19',
                        'dzuhur' => $jadwal['dzuhur'] ?? '12:00',
                        'ashar' => $jadwal['ashar'] ?? '15:26',
                        'maghrib' => $jadwal['maghrib'] ?? '18:19',
                        'isya' => $jadwal['isya'] ?? '19:28',
                        'imsak' => $jadwal['imsak'] ?? '04:09',
                        'sunrise' => $jadwal['terbit'] ?? '05:42',
                        'source' => 'myquran',
                    ];
                }
            }

            Log::warning('Failed to fetch prayer times from MyQuran API', [
                'status' => $response->status(),
                'url' => $url,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching prayer times from MyQuran API', [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Fetch prayer times from Aladhan API (fallback)
     *
     * @return array|null
     */
    private function fetchFromAladhan(): ?array
    {
        try {
            $response = Http::timeout(15)->get('https://api.aladhan.com/v1/timings', [
                'latitude' => self::BOGOR_LATITUDE,
                'longitude' => self::BOGOR_LONGITUDE,
                'method' => self::CALCULATION_METHOD,
                'timezone' => self::TIMEZONE,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['data']['timings'])) {
                    $timings = $data['data']['timings'];

                    return [
                        'subuh' => $this->formatTimeFromApi($timings['Fajr'] ?? '04:19'),
                        'dzuhur' => $this->formatTimeFromApi($timings['Dhuhr'] ?? '12:00'),
                        'ashar' => $this->formatTimeFromApi($timings['Asr'] ?? '15:26'),
                        'maghrib' => $this->formatTimeFromApi($timings['Maghrib'] ?? '18:19'),
                        'isya' => $this->formatTimeFromApi($timings['Isha'] ?? '19:28'),
                        'imsak' => $this->formatTimeFromApi($timings['Imsak'] ?? '04:09'),
                        'sunrise' => $this->formatTimeFromApi($timings['Sunrise'] ?? '05:42'),
                        'source' => 'aladhan',
                    ];
                }
            }

            Log::warning('Failed to fetch prayer times from Aladhan API', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching prayer times from Aladhan API', [
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
     * Update the prayer times (optional override for Jumat time).
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
            'jumat' => 'nullable|date_format:H:i', // Now optional - can use auto if not set
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
     * Reset Jumat time to auto-calculated (remove manual override)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetJumat(Request $request)
    {
        $prayerTimes = PrayerTime::first();

        if ($prayerTimes) {
            $prayerTimes->update([
                'jumat' => null,
                'updated_by' => $request->user()->id,
            ]);
        }

        // Clear cache
        Cache::forget('prayer_times_bogor_' . now()->format('Y-m-d'));

        return response()->json([
            'success' => true,
            'message' => 'Waktu Jum\'at di-reset ke otomatis (30 menit sebelum Dzuhur)',
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
