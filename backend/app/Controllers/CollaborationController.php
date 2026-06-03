<?php
// app/Controllers/CollaborationController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Session;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Services\CollaborationService;

class CollaborationController
{
    private CollaborationService $service;

    public function __construct()
    {
        $this->service = new CollaborationService();
    }

    // GET /api/collaborations?status=&role=
    public function index(): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $status = $_GET['status'] ?? null;
        $role   = $_GET['role']   ?? 'any'; // any | requester | receiver

        Response::success($this->service->listForUser($userId, $status, $role));
    }

    // GET /api/collaborations/{id}
    public function show(array $params): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $isAdmin = Session::get('user_role') === 'admin';

        if ($isAdmin) {
            $repo   = new \App\Repositories\CollaborationRepository();
            $collab = $repo->findById((int)$params['id']);
            if (!$collab) Response::notFound('Collaboration not found.');
            Response::success($collab);
        }

        $result = $this->service->getById((int)$params['id'], $userId);
        if (!$result['success']) {
            Response::error($result['message'], $result['code'] ?? 404);
        }
        Response::success($result['data']);
    }

    // POST /api/collaborations
    public function store(): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $body   = $this->jsonBody();

        $v = Validator::make($body, [
            'receiver_id' => 'required|integer',
            'skill_id'    => 'required|integer',
            'message'     => 'max:1000',
        ]);

        if ($v->fails()) Response::validationError($v->errors());

        $result = $this->service->sendRequest($userId, $body);

        if (!$result['success']) Response::error($result['message']);
        Response::success($result['data'], $result['message'], 201);
    }

    // PATCH /api/collaborations/{id}/status
    public function updateStatus(array $params): void
    {
        AuthMiddleware::handle();
        $userId = (int)Session::get('user_id');
        $body   = $this->jsonBody();

        $allowed = ['accepted', 'rejected', 'in_progress', 'completed'];
        $v = Validator::make($body, [
            'status' => 'required|in:' . implode(',', $allowed),
        ]);

        if ($v->fails()) Response::validationError($v->errors());

        $result = $this->service->transition((int)$params['id'], $userId, $body['status']);

        if (!$result['success']) {
            Response::error($result['message'], $result['code'] ?? 422);
        }
        Response::success($result['data'], $result['message']);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST;
    }
}
