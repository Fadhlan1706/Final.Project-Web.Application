<?php
// app/Controllers/ReviewController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Session;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Services\ReviewService;

class ReviewController
{
    private ReviewService $service;

    public function __construct()
    {
        $this->service = new ReviewService();
    }

    // GET /api/users/{id}/reviews?page=
    public function forUser(array $params): void
    {
        $userId  = (int)$params['id'];
        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 10;

        $reviews    = $this->service->getReviewsForUser($userId, $page, $perPage);
        $reputation = $this->service->getReputation($userId);

        Response::success([
            'reputation' => $reputation,
            'reviews'    => $reviews,
            'page'       => $page,
        ]);
    }

    // GET /api/reviews/top
    public function topRated(): void
    {
        $limit = min(20, max(5, (int)($_GET['limit'] ?? 10)));
        Response::success($this->service->getTopRated($limit));
    }

    // POST /api/reviews
    public function store(): void
    {
        AuthMiddleware::handle();
        $reviewerId = (int)Session::get('user_id');
        $body       = $this->jsonBody();

        $v = Validator::make($body, [
            'collaboration_id' => 'required|integer',
            'rating'           => 'required|integer|between:1,5',
            'comment'          => 'max:1000',
        ]);

        if ($v->fails()) Response::validationError($v->errors());

        $result = $this->service->submit($reviewerId, $body);

        if (!$result['success']) {
            Response::error($result['message'], $result['code'] ?? 422);
        }
        Response::success($result['data'], $result['message'], 201);
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST;
    }
}
