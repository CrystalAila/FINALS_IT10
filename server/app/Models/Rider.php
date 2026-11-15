<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rider extends Model
{
    protected $fillable = [
        'user_id',
        'farm_id',
        'fullname',
        'phone',
        'address',
        'photo_path',
        'license_photo_path',
        'vehicle_type',
        'plate_number',
        'status',
        'rejection_reason',
    ];

    protected $appends = [
        'photo_url',
        'license_photo_url',
    ];

    /**
     * Get the user account for this rider.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the optional farm if previously affiliated.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    /**
     * Get the orders assigned to the rider.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Accessor for full photo URL.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo_path) {
            return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
        }

        if (filter_var($this->photo_path, FILTER_VALIDATE_URL)) {
            return $this->photo_path;
        }

        return asset('storage/' . $this->photo_path);
    }

    /**
     * Accessor for full driver's license photo URL.
     */
    public function getLicensePhotoUrlAttribute(): ?string
    {
        if (!$this->license_photo_path) {
            return null;
        }

        if (filter_var($this->license_photo_path, FILTER_VALIDATE_URL)) {
            return $this->license_photo_path;
        }

        return asset('storage/' . $this->license_photo_path);
    }
}
