<?php
require 'app/Helpers/Database.php';
$db = \App\Helpers\Database::getInstance();
$stmt = $db->query('DESCRIBE users');
print_r($stmt->fetchAll());
