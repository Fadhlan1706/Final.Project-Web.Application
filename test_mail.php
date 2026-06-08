<?php
define('ROOT', __DIR__);
require ROOT . '/app/autoload.php';

$envFile = dirname(ROOT) . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if (str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim(trim($value), '"\'');
    }
}

try {
    $sent = \App\Services\MailService::sendVerificationCode('fadhlansyawal026@student.unsrat.ac.id', '123456');
    echo $sent ? "Email sent successfully!\n" : "Failed to send email.\n";
} catch (\Throwable $e) {
    echo "Mail Error: " . $e->getMessage() . "\n";
}
