<?php
// backend/config/database.php

class DatabaseConfig
{
    public static $host = "localhost";
    public static $port = "3306";
    public static $dbname = "skillSwapPlatform";
    public static $charset = "utf8mb4";
    public static $username = "root";
    public static $password = "andrew10";
}

// Crucial: This is what our Database helper helper needs!
return [
    'host'    => DatabaseConfig::$host,
    'port'    => DatabaseConfig::$port,
    'dbname'  => DatabaseConfig::$dbname,
    'charset' => DatabaseConfig::$charset,
    'user'    => DatabaseConfig::$username,
    'pass'    => DatabaseConfig::$password
];