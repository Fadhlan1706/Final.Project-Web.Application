<?php
// app/Helpers/Router.php

namespace App\Helpers;

class Router
{
    private static array $routes = [];

    /** Register a GET route */
    public static function get(string $path, callable|array $handler): void
    {
        self::add('GET', $path, $handler);
    }

    /** Register a POST route */
    public static function post(string $path, callable|array $handler): void
    {
        self::add('POST', $path, $handler);
    }

    /** Register a PUT route */
    public static function put(string $path, callable|array $handler): void
    {
        self::add('PUT', $path, $handler);
    }

    /** Register a DELETE route */
    public static function delete(string $path, callable|array $handler): void
    {
        self::add('DELETE', $path, $handler);
    }

    private static function add(string $method, string $path, callable|array $handler): void
    {
        self::$routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler,
        ];
    }

    /**
     * Dispatch the current request.
     * Supports named segments like /users/{id}
     */
    public static function dispatch(): void
    {
        // Support _method override for HTML forms
        $method = strtoupper($_SERVER['REQUEST_METHOD']);
        if ($method === 'POST' && !empty($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }
        // Also support X-HTTP-Method-Override header (AJAX)
        if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
            $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
        }

        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        foreach (self::$routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = self::toRegex($route['path']);
            if (preg_match($pattern, $uri, $matches)) {
                // Extract named params
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Invoke handler
                $handler = $route['handler'];
                if (is_array($handler)) {
                    [$class, $action] = $handler;
                    (new $class())->$action($params);
                } else {
                    $handler($params);
                }
                return;
            }
        }

        // No route matched
        Response::notFound('Endpoint not found.');
    }

    /** Convert /users/{id} to a named-capture regex */
    private static function toRegex(string $path): string
    {
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }
}
