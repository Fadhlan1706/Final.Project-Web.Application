<?php
// app/Middleware/AuthMiddleware.php

namespace App\Middleware;

use App\Helpers\Response;
use App\Helpers\Session;

class AuthMiddleware
{
    /**
     * Require a logged-in user.
     * Aborts with 401 if not authenticated.
     */
    public static function handle(): void
    {
        Session::start();

        if (!Session::has('user_id')) {
            Response::unauthorized('You must be logged in to access this resource.');
        }
    }

    /**
     * Require admin role.
     * Aborts with 403 if authenticated but not admin.
     */
    public static function admin(): void
    {
        self::handle(); // must be logged in first

        if (Session::get('user_role') !== 'admin') {
            Response::forbidden('Admin access required.');
        }
    }

    /**
     * Allow only guests (not logged in).
     * Aborts with 400 if already authenticated.
     */
    public static function guest(): void
    {
        Session::start();

        if (Session::has('user_id')) {
            Response::error('Already logged in.', 400);
        }
    }

    /**
     * Validate CSRF token from request body or header.
     */
    public static function csrf(): void
    {
        $token = $_POST['_csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (!Session::validateCsrf($token)) {
            Response::error('Invalid CSRF token.', 419);
        }
    }
}
