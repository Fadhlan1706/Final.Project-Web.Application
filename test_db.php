<?php
require 'app/Helpers/Database.php';
$db = \App\Helpers\Database::getInstance();
$stmt = $db->query('SELECT id, NAME FROM users');
print_r($stmt->fetchAll());
