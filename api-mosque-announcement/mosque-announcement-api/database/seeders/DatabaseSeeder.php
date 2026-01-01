<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Announcement;
use App\Models\PrayerTime;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin users
        User::create([
            'name' => 'Admin Masjid',
            'email' => 'admin@masjid.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Takmir Masjid',
            'email' => 'takmir@masjid.com',
            'password' => bcrypt('password123'),
            'role' => 'takmir',
        ]);

        // Seed prayer times
        PrayerTime::create([
            'subuh' => '04:30',
            'dzuhur' => '12:00',
            'ashar' => '15:15',
            'maghrib' => '18:00',
            'isya' => '19:15',
            'jumat' => '11:30',
            'imsak' => '04:20',
            'updated_by' => 1,
        ]);

        // Seed announcements
        $announcements = [
            [
                'title' => 'Jadwal Sholat Jumat',
                'content' => '<p>Assalamu\'alaikum Warahmatullahi Wabarakatuh</p><p>Mengingatkan kepada seluruh jamaah bahwa sholat Jumat akan dilaksanakan pada pukul <strong>11:30 WIB</strong>.</p><p><strong>Khatib:</strong> Ustadz Ahmad Maulana</p><p>Mohon untuk hadir tepat waktu.</p><p>Wassalamu\'alaikum Warahmatullahi Wabarakatuh</p>',
                'category' => 'jadwal_sholat',
                'is_active' => true,
                'publish_at' => now(),
            ],
            [
                'title' => 'Kajian Rutin Ba\'da Maghrib',
                'content' => '<p>Bismillahirrahmanirrahim</p><p>Mengundang seluruh jamaah untuk menghadiri kajian rutin yang diadakan setiap hari <strong>Senin dan Kamis</strong> ba\'da sholat Maghrib.</p><h3>Tema Kajian:</h3><ul><li>Fiqih Ibadah</li><li>Tafsir Al-Quran</li><li>Hadits Pilihan</li></ul><p>Pemateri: Ustadz Abdullah Hakim</p>',
                'category' => 'kajian',
                'is_active' => true,
                'publish_at' => now(),
            ],
            [
                'title' => 'Pengumuman Pembayaran Zakat Fitrah',
                'content' => '<p>Assalamu\'alaikum Wr. Wb.</p><p>Menjelang bulan Ramadhan yang akan datang, kami menginformasikan bahwa pembayaran <strong>Zakat Fitrah</strong> dapat dilakukan melalui:</p><ol><li>Langsung ke Sekretariat Masjid</li><li>Transfer ke rekening masjid: <strong>BSI 123-456-789</strong></li></ol><p>Besaran Zakat Fitrah: <strong>Rp 45.000/jiwa</strong> atau <strong>2.5 kg beras</strong></p><p>Wassalam</p>',
                'category' => 'zakat',
                'is_active' => true,
                'publish_at' => now(),
            ],
            [
                'title' => 'Kegiatan Buka Puasa Bersama',
                'content' => '<p>Dalam rangka menyambut bulan suci Ramadhan, masjid akan mengadakan kegiatan <strong>Buka Puasa Bersama</strong> setiap hari selama bulan Ramadhan.</p><p>Jamaah yang ingin berpartisipasi sebagai donatur dapat menghubungi pengurus masjid.</p><p>Jazakumullahu Khairan</p>',
                'category' => 'ramadhan',
                'is_active' => true,
                'publish_at' => now(),
            ],
            [
                'title' => 'Renovasi Tempat Wudhu',
                'content' => '<p>Kepada seluruh jamaah,</p><p>Kami informasikan bahwa akan dilakukan <strong>renovasi tempat wudhu</strong> mulai tanggal 25 Desember 2025 sampai dengan selesai.</p><p>Selama renovasi, jamaah dapat menggunakan tempat wudhu sementara yang telah disediakan di sebelah barat masjid.</p><p>Mohon maaf atas ketidaknyamanannya.</p>',
                'category' => 'pengumuman',
                'is_active' => true,
                'publish_at' => now(),
            ],
            [
                'title' => 'Santunan Anak Yatim',
                'content' => '<p>Alhamdulillah, masjid akan mengadakan kegiatan <strong>Santunan Anak Yatim</strong> pada:</p><p>📅 Hari/Tanggal: Minggu, 28 Desember 2025<br>🕐 Waktu: 08.00 - 11.00 WIB<br>📍 Tempat: Aula Masjid</p><p>Bagi jamaah yang ingin berpartisipasi, dapat menyalurkan bantuan ke secretariat masjid.</p>',
                'category' => 'donasi',
                'is_active' => true,
                'publish_at' => now(),
            ],
        ];

        foreach ($announcements as $announcement) {
            Announcement::create($announcement);
        }
    }
}
