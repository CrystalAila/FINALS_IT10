<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rider extends Model
{
    protected $fillable = [
        'farm_id', 'fullname', 'phone', 'photo_path',
    ];

    /**
     * Get the farm that owns the rider.
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
}
