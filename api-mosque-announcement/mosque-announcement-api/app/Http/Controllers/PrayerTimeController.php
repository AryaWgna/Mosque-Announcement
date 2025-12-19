<?php

namespace App\Http\Controllers;

use App\Models\PrayerTime;
use Illuminate\Http\Request;

class PrayerTimeController extends Controller
{
    /**
     * Display the prayer times.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
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
                ]
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => $prayerTimes
        ], 200);
    }

    /**
     * Update the prayer times.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'subuh' => 'required|date_format:H:i',
            'dzuhur' => 'required|date_format:H:i',
            'ashar' => 'required|date_format:H:i',
            'maghrib' => 'required|date_format:H:i',
            'isya' => 'required|date_format:H:i',
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

        return response()->json([
            'success' => true,
            'message' => 'Jadwal sholat berhasil diperbarui',
            'data' => $prayerTimes
        ], 200);
    }
}
