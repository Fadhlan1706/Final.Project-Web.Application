<?php
// app/Services/AuthService.php

namespace App\Services;

use App\Helpers\Session;
use App\Repositories\UserRepository;

class AuthService
{
    private UserRepository $users;

    public function __construct()
    {
        $this->users = new UserRepository();
    }

    public function register(array $data): array
    {
        if ($this->users->findByEmail($data['email'])) {
            return ['success' => false, 'message' => 'Email already registered.'];
        }

        $verificationCode = (string) rand(100000, 999999);

        $id = $this->users->create([
            'name'              => trim($data['name']),
            'email'             => strtolower(trim($data['email'])),
            'password'          => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'is_verified'       => 0,
            'verification_code' => $verificationCode,
        ]);

        $user = $this->users->findById($id);

        $emailSent = \App\Services\MailService::sendVerificationCode($data['email'], $verificationCode);

        if (!$emailSent) {
            return [
                'success' => false,
                'message' => 'User registered, but verification email failed to send. Please check your SMTP configuration.',
            ];
        }

        return [
            'success' => true,
            'message' => 'Registration successful. Please check your email for the verification code.',
            'data'    => $this->publicUser($user),
        ];
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail(strtolower(trim($email)));

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid email or password.'];
        }

        $status = $user['status'] ?? 'active';
        if ($status === 'suspended') {
            return ['success' => false, 'message' => 'Your account has been suspended.'];
        }

        if (isset($user['is_verified']) && $user['is_verified'] == 0) {
            return ['success' => false, 'message' => 'Please verify your email first before logging in.'];
        }

        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'message' => 'Invalid email or password.'];
        }

        Session::start();
        session_regenerate_id(true);

        Session::set('user_id',   $user['id']);
        Session::set('user_name', $user['name']);

        return [
            'success' => true,
            'message' => 'Login successful.',
            'data'    => $this->publicUser($user),
        ];
    }

    public function verifyEmail(string $email, string $code): array
    {
        $user = $this->users->findByEmail(strtolower(trim($email)));

        if (!$user) {
            return ['success' => false, 'message' => 'User not found.'];
        }

        if (isset($user['is_verified']) && $user['is_verified'] == 1) {
            return ['success' => false, 'message' => 'Email is already verified.'];
        }

        if (($user['verification_code'] ?? null) !== $code) {
            return ['success' => false, 'message' => 'Invalid verification code.'];
        }

        $this->users->verifyEmail((int)$user['id']);

        return ['success' => true, 'message' => 'Email verified successfully. You can now login.'];
    }

    public function logout(): void
    {
        Session::destroy();
    }

    public function changePassword(int $userId, string $current, string $newPassword): array
    {
        $user = $this->users->findByEmail(
            $this->users->findById($userId)['email'] ?? ''
        );

        if (!$user || !password_verify($current, $user['password'])) {
            return ['success' => false, 'message' => 'Current password is incorrect.'];
        }

        $this->users->updatePassword(
            $userId,
            password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12])
        );

        return ['success' => true, 'message' => 'Password changed successfully.'];
    }

    public function currentUser(): ?array
    {
        $id = Session::get('user_id');
        if (!$id) return null;
        return $this->users->findById((int)$id);
    }

    private function publicUser(array $user): array
    {
        unset($user['password']);
        return $user;
    }
}