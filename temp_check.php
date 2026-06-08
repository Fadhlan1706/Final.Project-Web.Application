<?php
require 'backend/app/Helpers/Database.php';
$db = \App\Helpers\Database::getInstance();
echo 'Users: ' . $db->query('SELECT COUNT(*) FROM users')->fetchColumn() . "\n";
echo 'Admins: ' . $db->query('SELECT COUNT(*) FROM admins')->fetchColumn() . "\n";
