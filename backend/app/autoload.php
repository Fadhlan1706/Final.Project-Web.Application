<?php
// app/autoload.php
// PSR-4 style autoloader — maps App\ → app/

spl_autoload_register(function (string $class): void {
    // Only handle App\ namespace
    if (strpos($class, 'App\\') !== 0) {
        return;
    }

    // App\Helpers\Database  →  /app/Helpers/Database.php
    $relative = substr($class, strlen('App\\'));
    $file = '/app/' . str_replace('\\', '/', $relative) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});
