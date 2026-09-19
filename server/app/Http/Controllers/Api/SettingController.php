<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Get all current system settings.
     */
    public function index()
    {
        return response()->json([
            'settings' => Setting::getAllSettings(),
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'minSellerCommission' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'maxSellerCommission' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'permitApprovalDays' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'notificationsEnabled' => ['sometimes', 'boolean'],
            'emailNotifications' => ['sometimes', 'boolean'],
            'smsNotifications' => ['sometimes', 'boolean'],
            'maintenanceMode' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all();

        if (array_key_exists('minSellerCommission', $data)) {
            Setting::set('min_seller_commission', (int) $data['minSellerCommission'], 'integer', 'policies');
        }

        if (array_key_exists('maxSellerCommission', $data)) {
            Setting::set('max_seller_commission', (int) $data['maxSellerCommission'], 'integer', 'policies');
        }

        if (array_key_exists('permitApprovalDays', $data)) {
            Setting::set('permit_approval_days', (int) $data['permitApprovalDays'], 'integer', 'policies');
        }

        if (array_key_exists('notificationsEnabled', $data)) {
            Setting::set('notifications_enabled', (bool) $data['notificationsEnabled'], 'boolean', 'notifications');
        }

        if (array_key_exists('emailNotifications', $data)) {
            Setting::set('email_notifications', (bool) $data['emailNotifications'], 'boolean', 'notifications');
        }

        if (array_key_exists('smsNotifications', $data)) {
            Setting::set('sms_notifications', (bool) $data['smsNotifications'], 'boolean', 'notifications');
        }

        if (array_key_exists('maintenanceMode', $data)) {
            Setting::set('maintenance_mode', (bool) $data['maintenanceMode'], 'boolean', 'system');
        }

        $summaryText = [];
        if (isset($data['maintenanceMode'])) {
            $summaryText[] = 'Maintenance Mode: ' . ($data['maintenanceMode'] ? 'ON' : 'OFF');
        }
        if (isset($data['minSellerCommission'])) {
            $summaryText[] = "Commission: {$data['minSellerCommission']}%-{$data['maxSellerCommission']}%";
        }

        $logMsg = 'Admin updated system configuration' . (!empty($summaryText) ? ' (' . implode(', ', $summaryText) . ')' : '');
        ActivityLogService::log($logMsg);

        return response()->json([
            'message' => 'System settings updated successfully',
            'settings' => Setting::getAllSettings(),
        ]);
    }

    /**
     * Reset system settings to platform defaults.
     */
    public function reset()
    {
        Setting::seedDefaults();

        ActivityLogService::log('Admin reset all system settings to default values');

        return response()->json([
            'message' => 'System settings restored to default values',
            'settings' => Setting::getAllSettings(),
        ]);
    }

    /**
     * Public endpoint to check system maintenance status.
     */
    public function status()
    {
        return response()->json([
            'maintenance_mode' => (bool) Setting::get('maintenance_mode', false),
        ]);
    }
}
