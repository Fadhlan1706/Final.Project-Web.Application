<?php
// app/Helpers/Database.php

namespace App\Helpers;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    /**
     * Returns the shared PDO connection.
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $cfg = require __DIR__ . '/../../config/database.php';

            // Safeguard: If config file didn't return a proper array, halt cleanly
            if (!is_array($cfg)) {
                http_response_code(500);
                header('Content-Type: application/json');
                die(json_encode(['error' => 'Database configuration file is missing or invalid.']));
            }

            $host    = $cfg['host'] ?? '127.0.0.1';
            $port    = $cfg['port'] ?? '3306';
            $dbname  = $cfg['dbname'] ?? '';
            $charset = $cfg['charset'] ?? 'utf8mb4';
            $user    = $cfg['user'] ?? 'root';
            $pass    = $cfg['pass'] ?? '';

            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $host,
                $port,
                $dbname,
                $charset
            );

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                // Ensure proper JSON header is sent so Thunder Client parses it correctly
                http_response_code(500);
                header('Content-Type: application/json');
                die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
            }
        }

        return self::$instance;
    }

    /** Prevent instantiation */
    private function __construct()
    {
    }
    private function __clone()
    {
    }
}