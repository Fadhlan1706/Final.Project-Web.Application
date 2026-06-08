<?php
// routes/api.php

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\CollaborationController;
use App\Controllers\ReviewController;
use App\Controllers\SkillController;
use App\Helpers\Router;

// ====================================================================
// AUTH
// ====================================================================
Router::post('/api/auth/register',     [AuthController::class, 'register']);
Router::post('/api/auth/verify-email', [AuthController::class, 'verifyEmail']);
Router::post('/api/auth/login',        [AuthController::class, 'login']);
Router::post('/api/auth/admin-login',  [AuthController::class, 'adminLogin']);
Router::post('/api/auth/logout',       [AuthController::class, 'logout']);
Router::get( '/api/auth/me',           [AuthController::class, 'me']);
Router::put( '/api/auth/password',  [AuthController::class, 'changePassword']);

// Profile
Router::put('/api/profile', [AuthController::class, 'updateProfile']);

// ====================================================================
// CATEGORIES (public)
// ====================================================================
Router::get('/api/categories', [SkillController::class, 'categories']);

// ====================================================================
// SKILLS
// ====================================================================
Router::get(   '/api/skills',          [SkillController::class, 'index']);     // browse all
Router::get(   '/api/skills/my',       [SkillController::class, 'mySkills']); // mine
Router::get(   '/api/skills/matches',  [SkillController::class, 'matches']);  // matched users
Router::get(   '/api/skills/stats',    [SkillController::class, 'stats']);    // popularity
Router::get(   '/api/skills/{id}',     [SkillController::class, 'show']);
Router::post(  '/api/skills',          [SkillController::class, 'store']);
Router::put(   '/api/skills/{id}',     [SkillController::class, 'update']);
Router::delete('/api/skills/{id}',     [SkillController::class, 'destroy']);

// ====================================================================
// EXPLORE (users / talents)
// ====================================================================
Router::get('/api/explore', function (): void {
    $repo    = new \App\Repositories\UserRepository();
    $filters = [
        'search'      => $_GET['search']      ?? null,
        'category_id' => $_GET['category_id'] ?? null,
        'level'       => $_GET['level']        ?? null,
        'min_rating'  => $_GET['min_rating']  ?? null,
    ];
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 12;
    \App\Helpers\Response::success($repo->searchTalents($filters, $page, $perPage));
});

// GET /api/users/{id}  — public profile
Router::get('/api/users/{id}', function (array $params): void {
    $repo = new \App\Repositories\UserRepository();
    $user = $repo->findById((int)$params['id']);
    if (!$user) \App\Helpers\Response::notFound('User not found.');
    $skills = (new \App\Repositories\SkillRepository())->findByUser((int)$params['id'], 'offered');
    $stats  = $repo->getStats((int)$params['id']);
    unset($user['password']);
    \App\Helpers\Response::success(array_merge($user, ['skills' => $skills, 'stats' => $stats]));
});

// GET /api/users/{id}/stats
Router::get('/api/users/{id}/stats', function (array $params): void {
    $repo = new \App\Repositories\UserRepository();
    \App\Helpers\Response::success($repo->getStats((int)$params['id']));
});

// ====================================================================
// COLLABORATIONS
// ====================================================================
Router::get(   '/api/collaborations',              [CollaborationController::class, 'index']);
Router::post(  '/api/collaborations',              [CollaborationController::class, 'store']);
Router::get(   '/api/collaborations/{id}',         [CollaborationController::class, 'show']);
Router::put(   '/api/collaborations/{id}/status',  [CollaborationController::class, 'updateStatus']);

// ====================================================================
// REVIEWS
// ====================================================================
Router::post('/api/reviews',               [ReviewController::class, 'store']);
Router::get( '/api/reviews/top',           [ReviewController::class, 'topRated']);
Router::get( '/api/users/{id}/reviews',    [ReviewController::class, 'forUser']);

// ====================================================================
// ADMIN
// ====================================================================
Router::get(   '/api/admin/reports',                    [AdminController::class, 'reports']);

// Users
Router::get(   '/api/admin/users',                      [AdminController::class, 'listUsers']);
Router::get(   '/api/admin/users/{id}',                 [AdminController::class, 'showUser']);
Router::put(   '/api/admin/users/{id}/suspend',         [AdminController::class, 'suspendUser']);
Router::put(   '/api/admin/users/{id}/restore',         [AdminController::class, 'restoreUser']);
Router::delete('/api/admin/users/{id}',                 [AdminController::class, 'deleteUser']);

// Categories
Router::get(   '/api/admin/categories',                 [AdminController::class, 'listCategories']);
Router::post(  '/api/admin/categories',                 [AdminController::class, 'createCategory']);
Router::put(   '/api/admin/categories/{id}',            [AdminController::class, 'updateCategory']);
Router::delete('/api/admin/categories/{id}',            [AdminController::class, 'deleteCategory']);

// Skills moderation
Router::delete('/api/admin/skills/{id}',                [AdminController::class, 'deleteSkill']);

// Collaborations
Router::get(   '/api/admin/collaborations',             [AdminController::class, 'listCollaborations']);

// Reports
Router::get(   '/api/admin/reports-list',               [AdminController::class, 'listReports']);
Router::put(   '/api/admin/reports/{id}',               [AdminController::class, 'updateReportStatus']);
