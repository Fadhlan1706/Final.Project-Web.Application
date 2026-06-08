<?php
require 'backend/app/Helpers/Database.php';
require 'backend/app/Repositories/UserRepository.php';
$db = \App\Helpers\Database::getInstance();
$users = new \App\Repositories\UserRepository();
try {
    var_dump($users->getStats(1));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
