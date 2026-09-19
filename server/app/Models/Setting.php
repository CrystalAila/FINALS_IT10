<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    /**
     * Cast raw database value to appropriate PHP type.
     */
    public static function castValue($value, string $type)
    {
        if (is_null($value)) {
            return null;
        }

        return match ($type) {
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer', 'int' => (int) $value,
            'float', 'double' => (float) $value,
            'json', 'array' => json_decode($value, true),
            default => (string) $value,
        };
    }

    /**
     * Get a setting by key with fallback default.
     */
    public static function get(string $key, $default = null)
    {
        self::ensureDefaults();

        $setting = self::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting by key.
     */
    public static function set(string $key, $value, ?string $type = null, ?string $group = null, ?string $description = null): self
    {
        $setting = self::firstOrNew(['key' => $key]);

        if ($type) {
            $setting->type = $type;
        } elseif (!$setting->type) {
            $setting->type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : (is_float($value) ? 'float' : 'string'));
        }

        if ($group) {
            $setting->group = $group;
        }

        if ($description) {
            $setting->description = $description;
        }

        // Store serialized value
        if (is_bool($value)) {
            $setting->value = $value ? '1' : '0';
        } elseif (is_array($value)) {
            $setting->value = json_encode($value);
        } else {
            $setting->value = (string) $value;
        }

        $setting->save();
        return $setting;
    }

    /**
     * Return all settings as a formatted associative dictionary.
     */
    public static function getAllSettings(): array
    {
        self::ensureDefaults();

        $all = self::all();
        $formatted = [];

        foreach ($all as $item) {
            $formatted[$item->key] = self::castValue($item->value, $item->type);
        }

        // Also return camelCase keys matching frontend expectations
        return [
            'minSellerCommission' => $formatted['min_seller_commission'] ?? 5,
            'maxSellerCommission' => $formatted['max_seller_commission'] ?? 10,
            'permitApprovalDays' => $formatted['permit_approval_days'] ?? 7,
            'notificationsEnabled' => $formatted['notifications_enabled'] ?? true,
            'emailNotifications' => $formatted['email_notifications'] ?? true,
            'smsNotifications' => $formatted['sms_notifications'] ?? false,
            'maintenanceMode' => $formatted['maintenance_mode'] ?? false,
            // Raw snake_case representation
            'raw' => $formatted,
        ];
    }

    /**
     * Seed initial platform defaults if table is empty.
     */
    public static function ensureDefaults(): void
    {
        if (self::count() > 0) {
            return;
        }

        self::seedDefaults();
    }

    /**
     * Force reset/seed of default settings.
     */
    public static function seedDefaults(): void
    {
        $defaults = [
            [
                'key' => 'min_seller_commission',
                'value' => '5',
                'type' => 'integer',
                'group' => 'policies',
                'description' => 'Minimum platform commission rate for sellers (%)',
            ],
            [
                'key' => 'max_seller_commission',
                'value' => '10',
                'type' => 'integer',
                'group' => 'policies',
                'description' => 'Maximum platform commission rate for sellers (%)',
            ],
            [
                'key' => 'permit_approval_days',
                'value' => '7',
                'type' => 'integer',
                'group' => 'policies',
                'description' => 'Allowed turnaround days for permit approvals',
            ],
            [
                'key' => 'notifications_enabled',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Global notification toggle',
            ],
            [
                'key' => 'email_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Enable automated email notifications',
            ],
            [
                'key' => 'sms_notifications',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'notifications',
                'description' => 'Enable urgent SMS notifications',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'system',
                'description' => 'Temporarily disable marketplace operations for maintenance',
            ],
        ];

        foreach ($defaults as $item) {
            self::updateOrCreate(['key' => $item['key']], $item);
        }
    }
}
