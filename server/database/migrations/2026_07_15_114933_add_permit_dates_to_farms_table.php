<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->date('permit_issue_date')->nullable()->after('permit_status');
            $table->date('permit_expiry_date')->nullable()->after('permit_issue_date');
        });

        // Expand enums
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE farms MODIFY COLUMN permit_status ENUM('pending', 'under_review', 'approved', 'rejected', 'suspended') DEFAULT 'pending'");
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'under_review', 'verified', 'suspended', 'rejected', 'active') DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->dropColumn(['permit_expiry_date', 'permit_issue_date']);
        });

        // Revert enums
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE farms MODIFY COLUMN permit_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'verified', 'suspended', 'rejected', 'active') DEFAULT 'active'");
    }
};
