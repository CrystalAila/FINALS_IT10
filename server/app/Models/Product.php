<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'farm_id', 'name', 'description', 'image', 'category',
        'price_small', 'price_medium', 'price_large', 'price_jumbo',
        'stock', 'rating', 'is_active',
    ];

    protected $casts = [
        'price_small' => 'decimal:2',
        'price_medium' => 'decimal:2',
        'price_large' => 'decimal:2',
        'price_jumbo' => 'decimal:2',
        'rating' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function priceForSize(string $size): float
    {
        return (float) match ($size) {
            'small' => $this->price_small,
            'medium' => $this->price_medium,
            'large' => $this->price_large,
            'jumbo' => $this->price_jumbo,
            default => $this->price_medium,
        };
    }
}
