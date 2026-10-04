<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'size', 'unit_type', 'estimated_quantity', 'actual_quantity', 'quantity', 'unit_price', 'subtotal',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'estimated_quantity' => 'decimal:2',
        'actual_quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
