<?php
$_SERVER['REQUEST_URI'] = '/api/admin/reports';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer admin'; // dummy auth

// We need to bypass auth, let's just instantiate the controller.
require 'backend/vendor/autoload.php';
require 'backend/app/Helpers/Database.php';
require 'backend/app/Repositories/UserRepository.php';
require 'backend/app/Repositories/SkillRepository.php';
require 'backend/app/Controllers/AdminController.php';

$c = new \App\Controllers\AdminController();

// We need to mock AuthMiddleware or bypass it. AdminController::reports calls AuthMiddleware::admin();
// Let's copy the code from reports() and run it directly.

$db = \App\Helpers\Database::getInstance();
$totalUsers = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
echo "totalUsers: " . $totalUsers . "\n";
