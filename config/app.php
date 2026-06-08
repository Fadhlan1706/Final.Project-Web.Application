<?php
// config/app.php

return [
    'name'         => 'Skill Swap Platform',
    'url'          => $_ENV['APP_URL']  ?? 'http://localhost',
    'debug'        => (bool)($_ENV['APP_DEBUG'] ?? true),
    'upload_dir'   => __DIR__ . '/../public/uploads/',
    'upload_url'   => '/uploads/',
    'max_file_size'=> 5 * 1024 * 1024, // 5 MB
    'allowed_image_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'allowed_file_types'  => ['application/pdf', 'image/jpeg', 'image/png'],
];
