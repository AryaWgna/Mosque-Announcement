<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\PrayerTimeController;

// Public routes
Route::get('/', function () {
    return response()->json([
        'message' => 'Selamat datang di Sistem Pengumuman Masjid Digital API',
        'version' => '1.0.0'
    ]);
});

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);

// Public announcement routes (with optional auth - if token provided, user will be set)
Route::middleware('auth.optional')->group(function () {
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
});

// Public prayer times route
Route::get('/prayer-times', [PrayerTimeController::class, 'index']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Announcement management routes (protected)
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Prayer times management (protected)
    Route::put('/prayer-times', [PrayerTimeController::class, 'update']);
    Route::post('/prayer-times/refresh', [PrayerTimeController::class, 'refresh']);
    Route::post('/prayer-times/reset-jumat', [PrayerTimeController::class, 'resetJumat']);
});
