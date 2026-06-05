<?php
// app/Controllers/AuthController.php

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Repositories\UserRepository;
use App\Services\AuthService;

class AuthController
{
    private AuthService    $auth;
    private UserRepository $users;

    public function __construct()
    {
        $this->auth  = new AuthService();
        $this->users = new UserRepository();
    }

    public function register(): void
    {
        AuthMiddleware::guest();

        $body = $this->jsonBody();

        $v = Validator::make($body, [
            'name'                  => 'required|min:2|max:100',
            'email'                 => 'required|email|max:150',
            'password'              => 'required|min:8|max:72',
            'password_confirmation' => 'required|confirmed',
        ]);

        $body['password_confirmation'] = $body['password_confirmation'] ?? '';

        $v2 = Validator::make($body, [
            'name'     => 'required|min:2|max:100',
            'email'    => 'required|email|max:150',
            'password' => 'required|min:8|max:72',
        ]);

        if (($body['password'] ?? '') !== ($body['password_confirmation'] ?? '')) {
            Response::validationError(['password_confirmation' => ['Passwords do not match.']]);
        }

        if ($v2->fails()) {
            Response::validationError($v2->errors());
        }

        if (isset($body['email']) && !str_ends_with($body['email'], '@student.unsrat.ac.id')) {
            Response::validationError(['email' => ['Please use your unsrat email to register.']]);
        }

        $result = $this->auth->register($body);

        if (!$result['success']) {
            Response::error($result['message'], 409);
        }

        Response::success($result['data'], $result['message'], 201);
    }

    public function verifyEmail(): void
    {
        AuthMiddleware::guest();

        $body = $this->jsonBody();

        $v = Validator::make($body, [
            'email' => 'required|email',
            'code'  => 'required',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $result = $this->auth->verifyEmail($body['email'], $body['code']);

        if (!$result['success']) {
            Response::error($result['message'], 400);
        }

        Response::success([], $result['message']);
    }

    public function login(): void
    {
        AuthMiddleware::guest();

        $body = $this->jsonBody();

        $v = Validator::make($body, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        // Restrict login to the specific student domain
        if (isset($body['email']) && !str_ends_with($body['email'], '@student.unsrat.ac.id')) {
            Response::validationError(['email' => ['Please use your unsrat email to login.']]);
        }

        $result = $this->auth->login($body['email'], $body['password']);

        if (!$result['success']) {
            Response::error($result['message'], 401);
        }

        Response::success($result['data'], $result['message']);
    }

    public function logout(): void
    {
        AuthMiddleware::handle();
        $this->auth->logout();
        Response::success(null, 'Logged out successfully.');
    }

    public function me(): void
    {
        AuthMiddleware::handle();

        $user = $this->auth->currentUser();

        if (!$user) {
            Response::unauthorized();
        }

        unset($user['password']);
        Response::success($user);
    }

    public function changePassword(): void
    {
        AuthMiddleware::handle();

        $body = $this->jsonBody();

        $v = Validator::make($body, [
            'current_password' => 'required',
            'new_password'     => 'required|min:8|max:72',
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        if (($body['new_password'] ?? '') !== ($body['new_password_confirmation'] ?? '')) {
            Response::validationError(['new_password_confirmation' => ['Passwords do not match.']]);
        }

        $userId = (int)\App\Helpers\Session::get('user_id');
        $result = $this->auth->changePassword($userId, $body['current_password'], $body['new_password']);

        if (!$result['success']) {
            Response::error($result['message'], 422);
        }

        Response::success(null, $result['message']);
    }

    public function updateProfile(): void
    {
        AuthMiddleware::handle();

        $userId = (int)\App\Helpers\Session::get('user_id');

        $isMultipart = str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
        $body        = $isMultipart ? $_POST : $this->jsonBody();

        $v = Validator::make($body, [
            'name'  => 'required|min:2|max:100',
            'bio'   => 'max:500',
            'major' => 'max:100'
        ]);

        if ($v->fails()) {
            Response::validationError($v->errors());
        }

        $updateData = [
            'name'  => $body['name'],
            'bio'   => $body['bio']   ?? null,
            'major' => $body['major'] ?? null,
        ];

        if ($isMultipart && !empty($_FILES['profilePicture']['tmp_name'])) {
            $avatarPath = $this->handleAvatarUpload($_FILES['profilePicture'], $userId);
            if ($avatarPath === false) {
                Response::error('Invalid or oversized image file.', 422);
            }
            $updateData['profilePicture'] = $avatarPath;
        }

        $this->users->updateProfile($userId, $updateData);

        $user = $this->users->findById($userId);
        unset($user['password']);
        Response::success($user, 'Profile updated.');
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? $_POST;
    }

    private function handleAvatarUpload(array $file, int $userId): string|false
    {
        $cfg       = require ROOT . '/config/app.php';
        $allowed   = $cfg['allowed_image_types'];
        $maxSize   = $cfg['max_file_size'];
        $uploadDir = $cfg['upload_dir'] . 'avatars/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        if ($file['size'] > $maxSize) return false;

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowed, true)) return false;

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $ext;
        $dest     = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) return false;

        return '/uploads/avatars/' . $filename;
    }
}