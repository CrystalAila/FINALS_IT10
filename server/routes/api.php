<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'profile']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
    Route::post('/logs', [LogController::class, 'store']);

    // Customer Routes
    Route::middleware([\App\Http\Middleware\RoleMiddleware::class . ':customer'])->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders', [OrderController::class, 'store']);

        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{id}', [AddressController::class, 'update']);
        Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
        Route::post('/addresses/{id}/default', [AddressController::class, 'setDefault']);

        Route::get('/farms/{id}', [FarmController::class, 'getFarmDetails']);
        Route::post('/farms/{id}/favorite', [FarmController::class, 'toggleFavorite']);
        Route::get('/customer/favorites', [FarmController::class, 'getFavorites']);

        Route::put('/orders/{id}/cancel', [OrderController::class, 'customerCancel']);
        Route::put('/orders/{id}/receive', [OrderController::class, 'customerReceive']);
    });

    // Seller & Reseller Routes
    Route::middleware([\App\Http\Middleware\RoleMiddleware::class . ':seller,reseller'])->group(function () {
        Route::get('/seller/orders', [OrderController::class, 'sellerIndex']);
        Route::put('/seller/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::put('/seller/orders/{id}/assign-rider', [OrderController::class, 'assignRider']);

        Route::get('/seller/riders', [RiderController::class, 'index']);
        Route::post('/seller/riders', [RiderController::class, 'store']);
        Route::delete('/seller/riders/{id}', [RiderController::class, 'destroy']);

        Route::get('/seller/products', [ProductController::class, 'sellerIndex']);
        Route::post('/seller/products', [ProductController::class, 'store']);
        Route::put('/seller/products/{id}', [ProductController::class, 'update']);

        // Seller Farm Shop Details
        Route::get('/seller/farm', [FarmController::class, 'show']);
        Route::post('/seller/farm', [FarmController::class, 'update']);
        Route::get('/seller/sales-report', [OrderController::class, 'salesReport']);
    });

    // Admin Routes
    Route::middleware([\App\Http\Middleware\RoleMiddleware::class . ':admin'])->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::get('/admin/users/{id}', [UserController::class, 'show']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::put('/admin/users/{id}', [UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
        Route::get('/admin/logs', [LogController::class, 'index']);

        // Permit Verification Routes
        Route::get('/admin/permits', [UserController::class, 'getPermits']);
        Route::put('/admin/permits/{id}/approve', [UserController::class, 'approvePermit']);
        Route::put('/admin/permits/{id}/reject', [UserController::class, 'rejectPermit']);
        Route::put('/admin/permits/{id}/request-revision', [UserController::class, 'requestRevisionPermit']);
        Route::put('/admin/permits/{id}/suspend', [UserController::class, 'suspendSeller']);
        Route::put('/admin/permits/{id}/under-review', [UserController::class, 'underReviewPermit']);
    });
});
