<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    protected $fillable = [
        'user_id', 'name', 'location', 'description',
        'permit_file', 'permit_status', 'permit_issue_date', 'permit_expiry_date', 'logo', 'rating',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'permit_issue_date' => 'date',
        'permit_expiry_date' => 'date',
    ];

    protected $appends = ['is_verified', 'is_permit_expired'];

    public function getIsVerifiedAttribute(): bool
    {
        return $this->permit_status === 'approved';
    }

    public function getIsPermitExpiredAttribute(): bool
    {
        if (!$this->permit_expiry_date) {
            if ($this->permit_issue_date) {
                return \Carbon\Carbon::parse($this->permit_issue_date)->addYear()->isPast();
            }
            return false;
        }
        return \Carbon\Carbon::parse($this->permit_expiry_date)->isPast();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
