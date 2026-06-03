<?php
// app/Helpers/Validator.php

namespace App\Helpers;

class Validator
{
    private array $errors = [];
    private array $data = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function make(array $data, array $rules): self
    {
        $v = new self($data);
        foreach ($rules as $field => $ruleString) {
            $v->apply($field, explode('|', $ruleString));
        }
        return $v;
    }

    private function apply(string $field, array $rules): void
    {
        $value = $this->data[$field] ?? null;

        foreach ($rules as $rule) {
            [$ruleName, $param] = array_pad(explode(':', $rule, 2), 2, null);

            match ($ruleName) {
                'required' => $this->required($field, $value),
                'email' => $this->email($field, $value),
                'min' => $this->min($field, $value, (int) $param),
                'max' => $this->max($field, $value, (int) $param),
                'in' => $this->in($field, $value, explode(',', $param)),
                'numeric' => $this->numeric($field, $value),
                'integer' => $this->integer($field, $value),
                'between' => $this->between($field, $value, $param),
                'url' => $this->url($field, $value),
                'confirmed' => $this->confirmed($field, $value),
                default => null,
            };
        }
    }

    private function required(string $field, mixed $value): void
    {
        if ($value === null || $value === '') {
            $this->errors[$field][] = "$field is required.";
        }
    }

    private function email(string $field, mixed $value): void
    {
        if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "$field must be a valid email address.";
        }
    }

    private function min(string $field, mixed $value, int $min): void
    {
        if ($value !== null && strlen((string) $value) < $min) {
            $this->errors[$field][] = "$field must be at least $min characters.";
        }
    }

    private function max(string $field, mixed $value, int $max): void
    {
        if ($value !== null && strlen((string) $value) > $max) {
            $this->errors[$field][] = "$field may not exceed $max characters.";
        }
    }

    private function in(string $field, mixed $value, array $allowed): void
    {
        if ($value !== null && !in_array($value, $allowed, true)) {
            $this->errors[$field][] = "$field must be one of: " . implode(', ', $allowed) . '.';
        }
    }

    private function numeric(string $field, mixed $value): void
    {
        if ($value !== null && !is_numeric($value)) {
            $this->errors[$field][] = "$field must be numeric.";
        }
    }

    private function integer(string $field, mixed $value): void
    {
        if ($value !== null && filter_var($value, FILTER_VALIDATE_INT) === false) {
            $this->errors[$field][] = "$field must be an integer.";
        }
    }

    private function between(string $field, mixed $value, string $param): void
    {
        [$min, $max] = array_map('intval', explode(',', $param));
        if ($value !== null && ($value < $min || $value > $max)) {
            $this->errors[$field][] = "$field must be between $min and $max.";
        }
    }

    private function url(string $field, mixed $value): void
    {
        if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->errors[$field][] = "$field must be a valid URL.";
        }
    }

    private function confirmed(string $field, mixed $value): void
    {
        if ($value !== ($this->data[$field . '_confirmation'] ?? null)) {
            $this->errors[$field][] = "$field confirmation does not match.";
        }
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }
    public function passes(): bool
    {
        return empty($this->errors);
    }
    public function errors(): array
    {
        return $this->errors;
    }

    /** Return sanitized value */
    public function get(string $field, mixed $default = null): mixed
    {
        return $this->data[$field] ?? $default;
    }
}
