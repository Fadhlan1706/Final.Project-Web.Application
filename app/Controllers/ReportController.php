<?php
// app/Controllers/ReportController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Session;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Repositories\ReportRepository;

class ReportController
{
    private ReportRepository $reports;

    public function __construct()
    {
        $this->reports = new ReportRepository();
    }

    // POST /api/reports
    public function store(): void
    {
        AuthMiddleware::handle();
        $reporterId = (int)Session::get('user_id');
        
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? $_POST;

        $v = Validator::make($body, [
            'reported_user_id' => 'required|integer',
            'reason'           => 'required|min:10|max:1000',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        if ($reporterId === (int)$body['reported_user_id']) {
            Response::error('You cannot report yourself.', 400);
        }

        // Dynamically find an admin to assign
        $db = \App\Helpers\Database::getInstance();
        $admin = $db->query("SELECT id FROM admins LIMIT 1")->fetch();
        $adminId = $admin ? $admin['id'] : 1;

        $id = $this->reports->create([
            'reporter_id'      => $reporterId,
            'reported_user_id' => (int)$body['reported_user_id'],
            'reason'           => trim($body['reason']),
            'handled_by_admin_id' => $adminId
        ]);

        Response::success(['id' => $id], 'Report submitted successfully.', 201);
    }
}
