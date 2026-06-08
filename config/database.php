<?php
// backend/config/database.php

class DatabaseConfig
{
    public static function getHost() { return $_ENV['DB_HOST'] ?? "localhost"; }
    public static function getPort() { return $_ENV['DB_PORT'] ?? "3306"; }
    public static function getDbName() { return $_ENV['DB_NAME'] ?? "skillSwapPlatform"; }
    public static function getCharset() { return "utf8mb4"; }
    public static function getUsername() { return $_ENV['DB_USER'] ?? "root"; }
    public static function getPassword() { return $_ENV['DB_PASS'] ?? ""; }
}

// Crucial: This is what our Database helper helper needs!
return [
    'host'    => DatabaseConfig::getHost(),
    'port'    => DatabaseConfig::getPort(),
    'dbname'  => DatabaseConfig::getDbName(),
    'charset' => DatabaseConfig::getCharset(),
    'user'    => DatabaseConfig::getUsername(),
    'pass'    => DatabaseConfig::getPassword()
];