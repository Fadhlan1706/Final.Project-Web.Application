<?php
// app/Controllers/SkillController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Session;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Repositories\CategoryRepository;
use App\Services\SkillService;

class SkillController
{
    private SkillService       $service;
    private CategoryRepository $categories;

    public function __construct()
    {
        $this->service    = new SkillService();
        $this->categories = new CategoryRepository();
    }

    // GET /api/skills?search=&category_id=&level=&type=&page=
    public function index(): void
    {
        $filters = [
            'search'      => $_GET['search']      ?? null,
            'category_id' => $_GET['category_id'] ?? null,
            'level'       => $_GET['level']        ?? null,
            'type'        => $_GET['type']         ?? null,
        ];
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(5, (int)($_GET['per_page'] ?? 20)));

        Response::success($this->service->search($filters, $page, $perPage));
    }

    // GET /api/skills/{id}
    public function show(array $params): void
    {
        $repo  = new \App\Repositories\SkillRepository();
        $skill = $repo->findById((int)$params['id']);

        if (!$skill) Response::notFound('Skill not found.');
        Response::success($skill);
    }

    // GET /api/skills/my          — my skills (offered)
    // GET /api/skills/my?type=wanted
    public function mySkills(): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $type   = $_GET['type'] ?? null;
        Response::success($this->service->listForUser($userId, $type));
    }

    // GET /api/skills/matches — skill-match recommendations
    public function matches(): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        Response::success($this->service->getMatches($userId));
    }

    // GET /api/skills/stats
    public function stats(): void
    {
        Response::success($this->service->getStats());
    }

    // GET /api/categories
    public function categories(): void
    {
        Response::success($this->categories->findAll());
    }

    // POST /api/skills
    public function store(): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $body   = $this->jsonBody();

        $v = Validator::make($body, [
            'category_id' => 'required|integer',
            'name'        => 'required|min:2|max:100',
            'level'       => 'required|in:beginner,intermediate,advanced',
            'type'        => 'required|in:offered,wanted',
            'description' => 'max:500',
        ]);

        if ($v->fails()) Response::validationError($v->errors());

        $result = $this->service->create($userId, $body);

        if (!$result['success']) Response::error($result['message']);
        Response::success($result['data'], $result['message'], 201);
    }

    // PUT /api/skills/{id}
    public function update(array $params): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $body   = $this->jsonBody();

        $v = Validator::make($body, [
            'category_id' => 'required|integer',
            'name'        => 'required|min:2|max:100',
            'level'       => 'required|in:beginner,intermediate,advanced',
            'type'        => 'required|in:offered,wanted',
        ]);

        if ($v->fails()) Response::validationError($v->errors());

        $result = $this->service->update((int)$params['id'], $userId, $body);

        if (!$result['success']) {
            $code = $result['code'] ?? 400;
            Response::error($result['message'], $code);
        }
        Response::success($result['data'], $result['message']);
    }

    // DELETE /api/skills/{id}
    public function destroy(array $params): void
    {
        AuthMiddleware::handle();
        $userId  = (int)Session::get('user_id');
        $isAdmin = Session::get('user_role') === 'admin';
        $result  = $this->service->delete((int)$params['id'], $userId, $isAdmin);

        if (!$result['success']) {
            $code = $result['code'] ?? 400;
            Response::error($result['message'], $code);
        }
        Response::success(null, $result['message']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST;
    }
}
