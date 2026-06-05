<?php
// app/autoload.php

spl_autoload_register(function (string $class): void {
    if (strpos($class, 'App\\') !== 0) {
        return;
    }

    $relative = substr($class, strlen('App\\'));
    $file = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});