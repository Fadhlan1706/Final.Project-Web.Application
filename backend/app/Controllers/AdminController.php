<?php
// app/Controllers/AdminController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Repositories\CategoryRepository;
use App\Repositories\CollaborationRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\SkillRepository;
use App\Repositories\UserRepository;

class AdminController
{
    private UserRepository          $users;
    private SkillRepository         $skills;
    private CategoryRepository      $categories;
    private CollaborationRepository $collabs;
    private ReviewRepository        $reviews;

    public function __construct()
    {
        $this->users      = new UserRepository();
        $this->skills     = new SkillRepository();
        $this->categories = new CategoryRepository();
        $this->collabs    = new CollaborationRepository();
        $this->reviews    = new ReviewRepository();
    }

    // ==============================================================
    // DASHBOARD / REPORTS
    // ==============================================================

    // GET /api/admin/reports
    public function reports(): void
    {
        AuthMiddleware::admin();

        $db = \App\Helpers\Database::getInstance();

        // Total counts
        $totalUsers = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();
        $totalSkills = (int)$db->query("SELECT COUNT(*) FROM skills WHERE is_active = 1")->fetchColumn();

        // Collaboration breakdown
        $collabStats = $this->collabs->countByStatus();

        // Top skills
        $popularSkills = $this->skills->popularSkills(5);
        $wantedSkills  = $this->skills->mostWanted(5);

        // Top rated users
        $topUsers = $this->reviews->topRated(5);

        // Recent registrations (last 7 days)
        $recentUsers = (int)$db->query(
            "SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        )->fetchColumn();

        Response::success([
            'totals' => [
                'users'           => $totalUsers,
                'skills'          => $totalSkills,
                'recent_users'    => $recentUsers,
                'collaborations'  => array_sum($collabStats),
            ],
            'collaboration_stats' => $collabStats,
            'popular_skills'      => $popularSkills,
            'most_wanted_skills'  => $wantedSkills,
            'top_rated_users'     => $topUsers,
        ]);
    }

    // ==============================================================
    // USER MANAGEMENT
    // ==============================================================

    // GET /api/admin/users?page=&search=
    public function listUsers(): void
    {
        AuthMiddleware::admin();

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 20;
        $search  = $_GET['search'] ?? null;

        // Simple search support
        $db = \App\Helpers\Database::getInstance();

        if ($search) {
            $stmt = $db->prepare(
                "SELECT id, name, email, role, is_active, created_at
                 FROM users
                 WHERE name LIKE ? OR email LIKE ?
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?"
            );
            $like = '%' . $search . '%';
            $stmt->execute([$like, $like, $perPage, ($page - 1) * $perPage]);
            $users = $stmt->fetchAll();
            $total = count($users); // simplified
        } else {
            $users = $this->users->findAll($page, $perPage);
            $total = $this->users->countAll();
        }

        Response::success([
            'items'       => $users,
            'total'       => $total,
            'page'        => $page,
            'per_page'    => $perPage,
            'total_pages' => (int)ceil($total / $perPage),
        ]);
    }

    // GET /api/admin/users/{id}
    public function showUser(array $params): void
    {
        AuthMiddleware::admin();

        $user = $this->users->findById((int)$params['id']);
        if (!$user) Response::notFound('User not found.');

        // Fetch their skills + stats
        $skills = $this->skills->findByUser((int)$params['id']);
        $stats  = $this->users->getStats((int)$params['id']);

        unset($user['password']);
        Response::success(array_merge($user, ['skills' => $skills, 'stats' => $stats]));
    }

    // PATCH /api/admin/users/{id}/suspend
    public function suspendUser(array $params): void
    {
        AuthMiddleware::admin();

        $userId = (int)$params['id'];
        $user   = $this->users->findById($userId);

        if (!$user) Response::notFound('User not found.');
        if ($user['role'] === 'admin') Response::forbidden('Cannot suspend an admin.');

        $this->users->setActiveStatus($userId, false);
        Response::success(null, 'User suspended.');
    }

    // PATCH /api/admin/users/{id}/restore
    public function restoreUser(array $params): void
    {
        AuthMiddleware::admin();

        $userId = (int)$params['id'];
        if (!$this->users->findById($userId)) Response::notFound('User not found.');

        $this->users->setActiveStatus($userId, true);
        Response::success(null, 'User restored.');
    }

    // DELETE /api/admin/users/{id}
    public function deleteUser(array $params): void
    {
        AuthMiddleware::admin();

        $userId = (int)$params['id'];
        $user   = $this->users->findById($userId);

        if (!$user) Response::notFound('User not found.');
        if ($user['role'] === 'admin') Response::forbidden('Cannot delete an admin account.');

        $this->users->delete($userId);
        Response::success(null, 'User deleted.');
    }

    // ==============================================================
    // CATEGORY MANAGEMENT
    // ==============================================================

    // GET /api/admin/categories
    public function listCategories(): void
    {
        AuthMiddleware::admin();
        Response::success($this->categories->findAll());
    }

    // POST /api/admin/categories
    public function createCategory(): void
    {
        AuthMiddleware::admin();
        $body = $this->jsonBody();

        $v = Validator::make($body, [
            'name'        => 'required|min:2|max:100',
            'description' => 'max:255',
        ]);
        if ($v->fails()) Response::validationError($v->errors());

        $id       = $this->categories->create($body);
        $category = $this->categories->findById($id);
        Response::success($category, 'Category created.', 201);
    }

    // PUT /api/admin/categories/{id}
    public function updateCategory(array $params): void
    {
        AuthMiddleware::admin();
        $body = $this->jsonBody();

        if (!$this->categories->findById((int)$params['id'])) {
            Response::notFound('Category not found.');
        }

        $v = Validator::make($body, [
            'name'        => 'required|min:2|max:100',
            'description' => 'max:255',
        ]);
        if ($v->fails()) Response::validationError($v->errors());

        $this->categories->update((int)$params['id'], $body);
        Response::success($this->categories->findById((int)$params['id']), 'Category updated.');
    }

    // DELETE /api/admin/categories/{id}
    public function deleteCategory(array $params): void
    {
        AuthMiddleware::admin();

        if (!$this->categories->findById((int)$params['id'])) {
            Response::notFound('Category not found.');
        }
        $this->categories->delete((int)$params['id']);
        Response::success(null, 'Category deleted.');
    }

    // ==============================================================
    // SKILL MODERATION
    // ==============================================================

    // DELETE /api/admin/skills/{id}   (hard delete — spam removal)
    public function deleteSkill(array $params): void
    {
        AuthMiddleware::admin();

        $repo  = new SkillRepository();
        $skill = $repo->findById((int)$params['id']);
        if (!$skill) Response::notFound('Skill not found.');

        $repo->hardDelete((int)$params['id']);
        Response::success(null, 'Skill permanently deleted.');
    }

    // GET /api/admin/collaborations?status=&page=
    public function listCollaborations(): void
    {
        AuthMiddleware::admin();

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 20;
        $status  = $_GET['status'] ?? null;

        $items = $this->collabs->findAll($status, $page, $perPage);
        Response::success(['items' => $items, 'page' => $page]);
    }

    // ----------------------------------------------------------------

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST;
    }
}
