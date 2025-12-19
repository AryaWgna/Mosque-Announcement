<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrayerTime extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subuh',
        'dzuhur',
        'ashar',
        'maghrib',
        'isya',
        'jumat',
        'imsak',
        'updated_by',
    ];

    /**
     * Get the user who updated the prayer times.
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
