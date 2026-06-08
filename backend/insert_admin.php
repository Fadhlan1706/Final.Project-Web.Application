<?php
require 'app/Helpers/Database.php';
$db = \App\Helpers\Database::getInstance();
$password = password_hash('admin123', PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO admins (NAME, email, PASSWORD) VALUES (?, ?, ?)');
$stmt->execute(['Fadhlan Adrevy', 'fadhlanadrevy17@gmail.com', $password]);
echo "Admin inserted successfully.";
