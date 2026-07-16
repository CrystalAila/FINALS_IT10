<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Log;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'fullname',
        'business_name',
        'username',
        'email',
        'phone',
        'google_id',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function logs()
    {
        return $this->hasMany(Log::class);
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    /**
     * Get the farm associated with the user (seller).
     */
    public function farm()
    {
        return $this->hasOne(Farm::class);
    }

    /**
     * Get the favorited farms for the user (customer).
     */
    public function favoriteFarms()
    {
        return $this->belongsToMany(Farm::class, 'favorite_farms');
    }
}
