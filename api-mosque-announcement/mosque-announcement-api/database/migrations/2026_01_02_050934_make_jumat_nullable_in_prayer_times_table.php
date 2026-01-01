<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Make jumat column nullable so it can use auto-calculated time (30 min before dzuhur)
     */
    public function up(): void
    {
        Schema::table('prayer_times', function (Blueprint $table) {
            $table->time('jumat')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prayer_times', function (Blueprint $table) {
            $table->time('jumat')->nullable(false)->change();
        });
    }
};
