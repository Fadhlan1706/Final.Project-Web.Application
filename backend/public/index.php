<?php
// public/index.php
// Single entry point for all requests.

declare(strict_types=1);

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
define('ROOT', dirname(__DIR__));

// ----------------------------------------------------------------
// Environment (.env support — simple key=value parser)
// ----------------------------------------------------------------
$envFile = ROOT . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#'))
            continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $_ENV[trim($key)] = trim($value);
    }
}

// ----------------------------------------------------------------
// Error reporting
// ----------------------------------------------------------------
$debug = filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN);
if ($debug) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// ----------------------------------------------------------------
// Autoloader
// ----------------------------------------------------------------
require ROOT . '/app/autoload.php';

// ----------------------------------------------------------------
// CORS headers (adjust origin in production)
// ----------------------------------------------------------------
$allowedOrigins = explode(',', $_ENV['CORS_ORIGINS'] ?? 'http://localhost:3000,http://localhost:5173');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HTTP-Method-Override, X-CSRF-Token');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ----------------------------------------------------------------
// Session
// ----------------------------------------------------------------
\App\Helpers\Session::start();

// ----------------------------------------------------------------
// Routes
// ----------------------------------------------------------------
require ROOT . '/routes/api.php';

// ----------------------------------------------------------------
// Dispatch
// ----------------------------------------------------------------
\App\Helpers\Router::dispatch();
