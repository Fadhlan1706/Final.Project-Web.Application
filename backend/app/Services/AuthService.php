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

    // ----------------------------------------------------------------
    // Register
    // ----------------------------------------------------------------

    /**
     * @return array{success: bool, message: string, data?: array}
     */
    public function register(array $data): array
    {
        // Check duplicate email
        if ($this->users->findByEmail($data['email'])) {
            return ['success' => false, 'message' => 'Email already registered.'];
        }

        $id = $this->users->create([
            'name'     => trim($data['name']),
            'email'    => strtolower(trim($data['email'])),
            'password' => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'role'     => 'user',
        ]);

        $user = $this->users->findById($id);

        return [
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => $this->publicUser($user),
        ];
    }

    // ----------------------------------------------------------------
    // Login
    // ----------------------------------------------------------------

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail(strtolower(trim($email)));

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid email or password.'];
        }

        if (!$user['is_active']) {
            return ['success' => false, 'message' => 'Your account has been suspended.'];
        }

        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'message' => 'Invalid email or password.'];
        }

        // Start session
        Session::start();
        session_regenerate_id(true); // prevent session fixation

        Session::set('user_id',   $user['id']);
        Session::set('user_role', $user['role']);
        Session::set('user_name', $user['name']);

        return [
            'success' => true,
            'message' => 'Login successful.',
            'data'    => $this->publicUser($user),
        ];
    }

    // ----------------------------------------------------------------
    // Logout
    // ----------------------------------------------------------------

    public function logout(): void
    {
        Session::destroy();
    }

    // ----------------------------------------------------------------
    // Change password
    // ----------------------------------------------------------------

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

    // ----------------------------------------------------------------
    // Current user (from session)
    // ----------------------------------------------------------------

    public function currentUser(): ?array
    {
        $id = Session::get('user_id');
        if (!$id) return null;
        return $this->users->findById((int)$id);
    }

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    /** Strip password hash before sending to client */
    private function publicUser(array $user): array
    {
        unset($user['password']);
        return $user;
    }
}
