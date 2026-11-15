<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        '*',
        'http://192.168.254.104.nip.io:5173',
        'http://192.168.254.104.nip.io:8000',
        'http://localhost:5173',
        'http://localhost:8000',
        'capacitor://localhost',
        'http://localhost',
    ],
    'allowed_origins_patterns' => ['*192.168.254.104.nip.io*'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
