<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminShare extends Model
{
    protected $fillable = [
        'seller_id',
        'farm_id',
        'billing_period',
        'period_start',
        'period_end',
        'total_revenue',
        'share_percentage',
        'share_amount',
        'due_date',
        'grace_period_date',
        'status',
        'paid_at',
        'payment_reference',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'due_date' => 'date',
        'grace_period_date' => 'date',
        'paid_at' => 'datetime',
        'total_revenue' => 'decimal:2',
        'share_percentage' => 'decimal:2',
        'share_amount' => 'decimal:2',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class, 'farm_id');
    }

    /**
     * Check if share is currently past the 7-day grace period.
     */
    public function isPastGracePeriod(): bool
    {
        return now()->startOfDay()->gt(\Carbon\Carbon::parse($this->grace_period_date)->endOfDay());
    }
}
