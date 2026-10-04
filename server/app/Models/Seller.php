<?php

namespace App\Models;

/**
 * Seller Model
 *
 * Represents a seller / shop (farm) entity in the system.
 */
class Seller extends Farm
{
    protected $table = 'farms';

    protected $fillable = [
        'user_id',
        'name',
        'location',
        'description',
        'permit_file',
        'permit_status',
        'permit_issue_date',
        'permit_expiry_date',
        'logo',
        'rating',
        'latitude',
        'longitude',
        'full_address',
    ];
}
