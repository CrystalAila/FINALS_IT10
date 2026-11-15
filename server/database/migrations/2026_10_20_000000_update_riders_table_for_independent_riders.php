<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('riders')) {
            // Drop foreign key on farm_id if exists
            try {
                Schema::table('riders', function (Blueprint $table) {
                    $table->dropForeign(['farm_id']);
                });
            } catch (\Throwable $e) {
                // Constraint might already have been dropped or named differently
            }

            // Modify farm_id to be nullable
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE riders MODIFY COLUMN farm_id BIGINT UNSIGNED NULL");
            } else {
                Schema::table('riders', function (Blueprint $table) {
                    $table->unsignedBigInteger('farm_id')->nullable()->change();
                });
            }

            // Add new rider profile columns if they don't exist
            Schema::table('riders', function (Blueprint $table) {
                if (!Schema::hasColumn('riders', 'address')) {
                    $table->string('address', 500)->nullable()->after('phone');
                }
                if (!Schema::hasColumn('riders', 'license_photo_path')) {
                    $table->string('license_photo_path')->nullable()->after('photo_path');
                }
                if (!Schema::hasColumn('riders', 'vehicle_type')) {
                    $table->string('vehicle_type', 100)->nullable()->after('license_photo_path');
                }
                if (!Schema::hasColumn('riders', 'plate_number')) {
                    $table->string('plate_number', 50)->nullable()->after('vehicle_type');
                }
                if (!Schema::hasColumn('riders', 'status')) {
                    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('plate_number');
                }
            });

            // Re-add nullable foreign key to farms
            try {
                Schema::table('riders', function (Blueprint $table) {
                    $table->foreign('farm_id')->references('id')->on('farms')->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // Ignore if unable to re-add constraint
            }

            // Ensure existing riders with active/verified user accounts are marked approved
            DB::statement("
                UPDATE riders r
                JOIN users u ON r.user_id = u.id
                SET r.status = 'approved'
                WHERE u.status IN ('active', 'verified')
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('riders')) {
            Schema::table('riders', function (Blueprint $table) {
                if (Schema::hasColumn('riders', 'status')) {
                    $table->dropColumn('status');
                }
                if (Schema::hasColumn('riders', 'plate_number')) {
                    $table->dropColumn('plate_number');
                }
                if (Schema::hasColumn('riders', 'vehicle_type')) {
                    $table->dropColumn('vehicle_type');
                }
                if (!Schema::hasColumn('riders', 'license_photo_path')) {
                    $table->dropColumn('license_photo_path');
                }
                if (!Schema::hasColumn('riders', 'address')) {
                    $table->dropColumn('address');
                }
            });
        }
    }
};
