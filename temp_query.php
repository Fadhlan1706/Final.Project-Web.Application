<?php
require 'app/autoload.php';
$db = \App\Helpers\Database::getInstance();
$stmt = $db->query('SELECT id, NAME, role FROM users');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
