<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'content',
        'category',
        'image_path',
        'video_path',
        'media_type',
        'publish_at',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'publish_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get available categories for mosque announcements.
     *
     * @return array
     */
    public static function getCategories(): array
    {
        return [
            'pengumuman' => 'Pengumuman Umum',
            'jadwal_sholat' => 'Info Waktu Sholat',
            'kajian' => 'Kajian & Pengajian',
            'ramadhan' => 'Ramadhan & Idul Fitri',
            'zakat' => 'Zakat & Infaq',
            'kegiatan' => 'Kegiatan Masjid',
            'donasi' => 'Donasi & Wakaf',
            'penting' => 'Pengumuman Penting',
        ];
    }
}
