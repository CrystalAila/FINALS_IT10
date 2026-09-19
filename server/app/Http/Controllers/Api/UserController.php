<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->query('role');
        $search = $request->query('search');

        $query = User::whereIn('role', ['seller', 'reseller', 'rider', 'admin'])
            ->with(['farm', 'rider.farm'])
            ->orderBy('created_at', 'desc');

        if ($role && $role !== 'all') {
            if ($role === 'seller') {
                $query->whereIn('role', ['seller', 'reseller']);
            } else {
                $query->where('role', $role);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('fullname', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('farm', fn ($f) => $f->where('name', 'like', "%{$search}%"));
            });
        }

        $users = $query->get()->map(function ($u) {
            $farm = null;
            if ($u->farm) {
                $farm = [
                    'name' => $u->farm->name,
                    'location' => $u->farm->location,
                    'description' => $u->farm->description,
                    'permit_file' => $u->farm->permit_file,
                    'permit_status' => $u->farm->permit_status,
                    'permit_issue_date' => $u->farm->permit_issue_date,
                    'permit_expiry_date' => $u->farm->permit_expiry_date,
                ];
            } elseif ($u->rider && $u->rider->farm) {
                $farm = [
                    'name' => $u->rider->farm->name,
                    'location' => $u->rider->farm->location,
                    'description' => $u->rider->farm->description,
                ];
            }

            $phone = $u->phone ?: ($u->rider ? $u->rider->phone : null);

            return [
                'id' => $u->id,
                'fullname' => $u->fullname,
                'username' => $u->username,
                'role' => $u->role,
                'created_at' => $u->created_at ? $u->created_at->toIso8601String() : null,
                'updated_at' => $u->updated_at ? $u->updated_at->toIso8601String() : null,
                'is_rider' => $u->role === 'rider',
                'status' => $u->status,
                'business_name' => $u->business_name,
                'email' => $u->email,
                'phone' => $phone,
                'farm' => $farm,
            ];
        });

        return response()->json(['users' => $users]);
    }

    public function show($id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'username' => ['required', 'string', 'max:255', 'alpha_num', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
            'role' => ['required', 'in:admin,reseller,customer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $user = User::create([
            'fullname' => $data['fullname'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        ActivityLogService::log("Admin created user {$user->username}");

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'username' => ['required', 'string', 'max:255', 'alpha_num', 'unique:users,username,'.$user->id],
            'password' => ['nullable', 'string', 'min:6', 'max:72'],
            'role' => ['required', 'in:admin,reseller,customer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $user->fullname = $data['fullname'];
        $user->username = $data['username'];
        $user->role = $data['role'];

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        ActivityLogService::log("Admin updated user {$user->username}");

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])]);
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $currentUser = auth()->user();
        if ($currentUser && $currentUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        $username = $user->username;
        $user->delete();

        ActivityLogService::log("Admin deleted user {$username}");

        return response()->json(['message' => 'User deleted']);
    }

    public function getPermits(Request $request)
    {
        $status = $request->query('status'); // 'all', 'pending', 'approved', 'rejected', 'suspended', 'under_review'

        $query = User::whereIn('role', ['seller', 'reseller'])->with('farm');

        if ($status && $status !== 'all') {
            if ($status === 'pending') {
                $query->where('status', 'pending');
            } elseif ($status === 'under_review') {
                $query->where('status', 'under_review');
            } elseif ($status === 'approved') {
                $query->where('status', 'verified');
            } elseif ($status === 'suspended') {
                $query->where('status', 'suspended');
            } elseif ($status === 'rejected') {
                $query->where('status', 'rejected');
            }
        }

        $sellers = $query->orderBy('created_at', 'desc')->get();

        $mapped = $sellers->map(function ($seller) {
            $farm = $seller->farm;

            // Auto-suspend expired permits on the fly if checked in UI
            if ($farm && $farm->permit_expiry_date && \Illuminate\Support\Carbon::parse($farm->permit_expiry_date)->isPast() && $seller->status !== 'suspended') {
                $seller->status = 'suspended';
                $seller->save();
                $farm->permit_status = 'suspended';
                $farm->save();
            }

            $uiStatus = 'Pending';
            if ($seller->status === 'under_review') {
                $uiStatus = 'Under Review';
            } elseif ($seller->status === 'verified') {
                $uiStatus = 'Approved';
            } elseif ($seller->status === 'suspended') {
                $uiStatus = 'Suspended';
            } elseif ($seller->status === 'rejected') {
                $uiStatus = 'Rejected';
            }

            $documents = [];
            if ($farm && $farm->permit_file) {
                $documents[] = basename($farm->permit_file);
            }

            return [
                'id' => $seller->id,
                'seller_name' => $seller->business_name ?? ($farm ? $farm->name : $seller->fullname),
                'status' => $uiStatus,
                'documents' => $documents,
                'submitted_at' => $seller->created_at ? $seller->created_at->diffForHumans() : 'unknown',
                'notes' => $farm ? $farm->description : null,
                'permit_url' => $farm && $farm->permit_file ? asset('storage/' . $farm->permit_file) : null,
                'permit_issue_date' => $farm ? $farm->permit_issue_date : null,
                'permit_expiry_date' => $farm ? $farm->permit_expiry_date : null,
            ];
        });

        return response()->json($mapped);
    }

    public function approvePermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'verified';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'approved';
            $farm->save();
        }

        ActivityLogService::log("Admin verified seller {$user->username}");
        return response()->json(['message' => 'Seller verified and permit approved']);
    }

    public function rejectPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'rejected';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'rejected';
            $farm->save();
        }

        ActivityLogService::log("Admin rejected permit for seller {$user->username}");
        return response()->json(['message' => 'Seller permit rejected']);
    }

    public function requestRevisionPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'pending';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'pending';
            $farm->save();
        }

        ActivityLogService::log("Admin requested permit revision for seller {$user->username}");
        return response()->json(['message' => 'Permit revision requested']);
    }

    public function suspendSeller($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'suspended';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'rejected';
            $farm->save();
        }

        ActivityLogService::log("Admin suspended seller {$user->username}");
        return response()->json(['message' => 'Seller account suspended']);
    }

    public function underReviewPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'under_review';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'under_review';
            $farm->save();
        }

        ActivityLogService::log("Admin set seller {$user->username} status to Under Review");
        return response()->json(['message' => 'Seller permit is now under review']);
    }

    public function getReportsSummary(Request $request)
    {
        $totalSellers = User::whereIn('role', ['seller', 'reseller'])->count();
        $verifiedSellers = User::whereIn('role', ['seller', 'reseller'])
            ->where(function ($q) {
                $q->where('status', 'verified')
                  ->orWhereHas('farm', fn ($f) => $f->where('permit_status', 'approved'));
            })
            ->count();
        $pendingPermits = User::whereIn('role', ['seller', 'reseller'])
            ->where(function ($q) {
                $q->whereIn('status', ['pending', 'under_review'])
                  ->orWhereHas('farm', fn ($f) => $f->whereIn('permit_status', ['pending', 'under_review']));
            })
            ->count();

        $totalOrders = \App\Models\Order::count();
        $completedOrders = \App\Models\Order::where('status', 'completed')->count();
        $totalRevenue = (float) \App\Models\Order::where('status', 'completed')->sum('total');

        // Let's also get counts for order statuses
        $orderStats = [
            'pending' => \App\Models\Order::where('status', 'pending')->count(),
            'confirmed' => \App\Models\Order::where('status', 'confirmed')->count(),
            'processing' => \App\Models\Order::where('status', 'processing')->count(),
            'ready' => \App\Models\Order::where('status', 'ready')->count(),
            'completed' => $completedOrders,
            'cancelled' => \App\Models\Order::where('status', 'cancelled')->count(),
        ];

        // Daily sales for the last 15 days
        $startDate = now()->subDays(14)->startOfDay();
        $dailySales = \App\Models\Order::where('status', 'completed')
            ->where(function ($q) use ($startDate) {
                $q->where('created_at', '>=', $startDate)
                  ->orWhere('updated_at', '>=', $startDate);
            })
            ->selectRaw('DATE(created_at) as date, SUM(total) as total')
            ->groupBy('date')
            ->get()
            ->pluck('total', 'date');

        $chartData = [];
        for ($i = 14; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $chartData[] = [
                'label' => $date->format('M d'),
                'date' => $dateStr,
                'revenue' => (float) ($dailySales[$dateStr] ?? 0),
            ];
        }

        // Recent transactions
        $recentTransactions = \App\Models\Order::with('customer')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'customer_name' => $order->customer->fullname ?? 'Unknown Customer',
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'date' => $order->created_at ? $order->created_at->format('M d, Y') : 'Unknown',
                ];
            });

        return response()->json([
            'total_sellers' => $totalSellers,
            'verified_sellers' => $verifiedSellers,
            'pending_permits' => $pendingPermits,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'order_stats' => $orderStats,
            'chart_data' => $chartData,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    public function getDashboardStats(Request $request)
    {
        // 1. Registered Sellers (seller, reseller)
        $registeredSellers = User::whereIn('role', ['seller', 'reseller'])->count();

        // 2. Verified Sellers
        $verifiedSellers = User::whereIn('role', ['seller', 'reseller'])
            ->where(function ($q) {
                $q->where('status', 'verified')
                  ->orWhereHas('farm', fn ($f) => $f->where('permit_status', 'approved'));
            })
            ->count();

        // 3. Total Buyers
        $buyers = User::where('role', 'customer')->count();

        // 4. Products Listed
        $products = \App\Models\Product::count();

        // 5. Total Transactions
        $transactions = \App\Models\Order::count();

        // 6. Pending Permits (sellers with status pending or under_review)
        $pendingPermits = User::whereIn('role', ['seller', 'reseller'])
            ->where(function ($q) {
                $q->whereIn('status', ['pending', 'under_review'])
                  ->orWhereHas('farm', fn ($f) => $f->whereIn('permit_status', ['pending', 'under_review']));
            })
            ->count();

        // 7. Monthly Revenue from completed orders across all sellers & Admin 5% Share
        \App\Services\AdminShareService::syncSharesForMonth();
        \App\Services\AdminShareService::checkAndApplyAutoSuspensions();

        $currentMonth = now()->format('Y-m');
        $monthlyRevenue = (float) \App\Models\Order::where('status', 'completed')
            ->where(function ($q) {
                $q->where('created_at', '>=', now()->startOfMonth())
                  ->orWhere('updated_at', '>=', now()->startOfMonth());
            })
            ->sum('total');

        $adminShare = round($monthlyRevenue * 0.05, 2);
        $adminShareCollected = (float) \App\Models\AdminShare::where('billing_period', $currentMonth)
            ->where('status', 'paid')
            ->sum('share_amount');
        $adminShareDue = (float) \App\Models\AdminShare::where('billing_period', $currentMonth)
            ->where('status', 'unpaid')
            ->sum('share_amount');
        $unpaidSharesCount = \App\Models\AdminShare::whereIn('status', ['unpaid', 'overdue'])
            ->where('share_amount', '>', 0)
            ->distinct('seller_id')
            ->count('seller_id');

        $totalRevenue = (float) \App\Models\Order::where('status', 'completed')->sum('total');

        // 8. Flagged Listings
        // Listings flagged explicitly OR belonging to suspended/rejected sellers/farms
        $flaggedListings = \App\Models\Product::where('is_flagged', true)
            ->orWhereHas('farm', function ($q) {
                $q->whereIn('permit_status', ['suspended', 'rejected'])
                  ->orWhereHas('user', fn ($u) => $u->where('status', 'suspended'));
            })
            ->count();

        // Weekly activity: last 7 days of orders
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $targetDate = now()->subDays($i);
            $dateStr = $targetDate->format('Y-m-d');
            $dayName = $targetDate->format('l');
            $shortDate = $targetDate->format('M d');
            $orderCount = \App\Models\Order::whereDate('created_at', $dateStr)->count();

            $weeklyActivity[] = [
                'day' => $dayName,
                'date' => $shortDate,
                'orders' => $orderCount,
            ];
        }

        return response()->json([
            'registeredSellers' => $registeredSellers,
            'verifiedSellers' => $verifiedSellers,
            'buyers' => $buyers,
            'products' => $products,
            'transactions' => $transactions,
            'pendingPermits' => $pendingPermits,
            'adminShare' => $adminShare,
            'adminShareCollected' => $adminShareCollected,
            'adminShareDue' => $adminShareDue,
            'unpaidSharesCount' => $unpaidSharesCount,
            'revenue' => $adminShare,
            'monthlyRevenue' => $monthlyRevenue,
            'totalRevenue' => $totalRevenue,
            'flaggedListings' => $flaggedListings,
            'weeklyActivity' => $weeklyActivity,
        ]);
    }

    public function getRecentActivity(Request $request)
    {
        $limit = (int) $request->query('limit', 5);
        $logs = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'activity' => $log->activity,
                    'user' => $log->user ? ($log->user->fullname ?? $log->user->username) : 'System',
                    'created_at' => $log->created_at ? $log->created_at->diffForHumans() : '',
                ];
            });

        return response()->json($logs);
    }

    public function getAdminProducts(Request $request)
    {
        $statusFilter = $request->query('status'); // 'all', 'active', 'inactive', 'flagged'
        $search = $request->query('search');

        // Top summary metrics
        $totalActiveProducts = \App\Models\Product::where('is_active', true)->count();
        $activeSellers = User::whereIn('role', ['seller', 'reseller'])
            ->where(function ($q) {
                $q->where('status', 'verified')
                  ->orWhereHas('farm', fn ($f) => $f->where('permit_status', 'approved'));
            })
            ->count();
        $ordersToday = \App\Models\Order::whereDate('created_at', now()->format('Y-m-d'))->count();

        $query = \App\Models\Product::with(['farm.user'])->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('farm_origin', 'like', "%{$search}%")
                  ->orWhereHas('farm', function ($f) use ($search) {
                      $f->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                  });
            });
        }

        $allProducts = $query->get();

        $mapped = $allProducts->map(function ($product) {
            $farm = $product->farm;
            $seller = $farm ? $farm->user : null;

            $isFlagged = (bool) $product->is_flagged ||
                ($farm && in_array($farm->permit_status, ['suspended', 'rejected'])) ||
                ($farm && $farm->is_permit_expired) ||
                ($seller && $seller->status === 'suspended');

            $verificationStatus = 'Verified';
            if ($isFlagged) {
                $verificationStatus = 'Flagged';
            } elseif (!$farm || $farm->permit_status === 'pending' || $farm->permit_status === 'under_review') {
                $verificationStatus = 'Pending';
            }

            $uiStatus = 'Active';
            if ($seller && $seller->status === 'suspended') {
                $uiStatus = 'Suspended';
            } elseif (!$product->is_active) {
                $uiStatus = 'Inactive';
            }

            $price = (float) ($product->price_medium > 0 ? $product->price_medium : ($product->price_small > 0 ? $product->price_small : $product->price_large));

            return [
                'id' => $product->id,
                'name' => $product->name,
                'seller' => $farm ? $farm->name : ($seller ? ($seller->business_name ?? $seller->fullname) : 'Unknown Seller'),
                'farm_origin' => $product->farm_origin ?: ($farm && $farm->location ? $farm->location : 'Capiz, Philippines'),
                'verification_status' => $verificationStatus,
                'status' => $uiStatus,
                'price' => $price,
                'image' => $product->image,
                'category' => $product->category,
                'stock' => $product->stock,
                'is_flagged' => (bool) $product->is_flagged,
            ];
        });

        // Filter by status
        if ($statusFilter && $statusFilter !== 'all') {
            if ($statusFilter === 'active') {
                $mapped = $mapped->filter(fn ($p) => $p['status'] === 'Active' && $p['verification_status'] !== 'Flagged')->values();
            } elseif ($statusFilter === 'inactive') {
                $mapped = $mapped->filter(fn ($p) => $p['status'] === 'Inactive')->values();
            } elseif ($statusFilter === 'flagged') {
                $mapped = $mapped->filter(fn ($p) => $p['verification_status'] === 'Flagged')->values();
            }
        }

        return response()->json([
            'stats' => [
                'live_listings' => $totalActiveProducts,
                'active_sellers' => $activeSellers,
                'orders_today' => $ordersToday,
            ],
            'products' => $mapped,
        ]);
    }

    public function toggleProductFlag($id)
    {
        $product = \App\Models\Product::findOrFail($id);
        $product->is_flagged = !$product->is_flagged;
        $product->save();

        ActivityLogService::log("Admin toggled flag for product {$product->name}");

        return response()->json([
            'message' => $product->is_flagged ? 'Product has been flagged' : 'Product flag removed',
            'product' => $product,
        ]);
    }

    /**
     * Get all registered sellers with their farm details, sales metrics, and product inventory for Market Monitoring.
     */
    public function getMarketSellers(Request $request)
    {
        $sellers = User::whereIn('role', ['seller', 'reseller'])
            ->with([
                'farm.products',
                'farm.orders',
            ])
            ->orderBy('id', 'desc')
            ->get();

        $mapped = $sellers->map(function ($seller) {
            $farm = $seller->farm;
            $orders = $farm ? $farm->orders : collect();
            $products = $farm ? $farm->products : collect();

            $completedOrders = $orders->where('status', 'completed');
            $totalRevenue = (float) $completedOrders->sum('total');
            $totalTransactions = $orders->count();
            $completedCount = $completedOrders->count();
            $pendingCount = $orders->where('status', 'pending')->count();
            $cancelledCount = $orders->where('status', 'cancelled')->count();

            $isVerified = ($seller->status === 'verified') || ($farm && $farm->permit_status === 'approved');
            $displayStatus = $seller->status === 'suspended' ? 'Suspended' : ($isVerified ? 'Verified' : 'Pending');

            return [
                'id' => $seller->id,
                'fullname' => $seller->fullname,
                'business_name' => $seller->business_name,
                'username' => $seller->username,
                'email' => $seller->email,
                'phone' => $seller->phone,
                'role' => $seller->role,
                'status' => $seller->status,
                'display_status' => $displayStatus,
                'created_at' => $seller->created_at ? $seller->created_at->format('M d, Y') : null,
                'farm' => $farm ? [
                    'id' => $farm->id,
                    'name' => $farm->name,
                    'location' => $farm->location,
                    'description' => $farm->description,
                    'permit_status' => $farm->permit_status,
                    'permit_issue_date' => $farm->permit_issue_date ? $farm->permit_issue_date->format('Y-m-d') : null,
                    'permit_expiry_date' => $farm->permit_expiry_date ? $farm->permit_expiry_date->format('Y-m-d') : null,
                    'is_permit_expired' => $farm->is_permit_expired,
                    'rating' => $farm->rating,
                ] : null,
                'total_revenue' => $totalRevenue,
                'total_transactions' => $totalTransactions,
                'completed_transactions' => $completedCount,
                'pending_transactions' => $pendingCount,
                'cancelled_transactions' => $cancelledCount,
                'products_count' => $products->count(),
                'products' => $products->map(function ($product) {
                    $price = (float) ($product->price_medium > 0 ? $product->price_medium : ($product->price_small > 0 ? $product->price_small : $product->price_large));
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'category' => $product->category,
                        'description' => $product->description,
                        'image' => $product->image,
                        'price' => $price,
                        'price_small' => (float) $product->price_small,
                        'price_medium' => (float) $product->price_medium,
                        'price_large' => (float) $product->price_large,
                        'price_jumbo' => (float) $product->price_jumbo,
                        'stock' => (int) ($product->stock ?? 0),
                        'is_active' => (bool) $product->is_active,
                        'is_flagged' => (bool) $product->is_flagged,
                        'farm_origin' => $product->farm_origin,
                        'rating' => (float) ($product->rating ?? 0),
                    ];
                })->values(),
            ];
        });

        $totalSellers = $mapped->count();
        $verifiedSellers = $mapped->filter(fn ($s) => $s['display_status'] === 'Verified')->count();
        $totalTransactions = \App\Models\Order::count();
        $totalMarketRevenue = (float) \App\Models\Order::where('status', 'completed')->sum('total');

        return response()->json([
            'stats' => [
                'total_sellers' => $totalSellers,
                'verified_sellers' => $verifiedSellers,
                'total_transactions' => $totalTransactions,
                'total_revenue' => $totalMarketRevenue,
            ],
            'sellers' => $mapped,
        ]);
    }
}

