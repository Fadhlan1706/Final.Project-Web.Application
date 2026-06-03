<?php
// app/Repositories/UserRepository.php

namespace App\Repositories;

use App\Helpers\Database;
use PDO;

class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ----------------------------------------------------------------
    // Finders
    // ----------------------------------------------------------------

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, email, role, avatar, bio, jurusan, angkatan, is_active, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $stmt   = $this->db->prepare(
            'SELECT id, name, email, role, avatar, bio, jurusan, angkatan, is_active, created_at
             FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function countAll(): int
    {
        return (int)$this->db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }

    // ----------------------------------------------------------------
    // Explore / Talent Search
    // ----------------------------------------------------------------

    /**
     * Search users who have skills matching a query.
     * Optionally filter by category, level, and minimum rating.
     */
    public function searchTalents(array $filters = [], int $page = 1, int $perPage = 12): array
    {
        $conditions = ['u.is_active = 1', "u.role = 'user'"];
        $bindings   = [];

        if (!empty($filters['search'])) {
            $conditions[] = '(s.name LIKE ? OR u.name LIKE ?)';
            $bindings[]   = '%' . $filters['search'] . '%';
            $bindings[]   = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 's.category_id = ?';
            $bindings[]   = (int)$filters['category_id'];
        }
        if (!empty($filters['level'])) {
            $conditions[] = 's.level = ?';
            $bindings[]   = $filters['level'];
        }

        $where  = implode(' AND ', $conditions);
        $offset = ($page - 1) * $perPage;

        $sql = "
            SELECT DISTINCT
                u.id, u.name, u.avatar, u.bio, u.jurusan,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(DISTINCT r.id)       AS review_count
            FROM users u
            LEFT JOIN skills  s ON s.user_id = u.id AND s.type = 'offered' AND s.is_active = 1
            LEFT JOIN reviews r ON r.reviewee_id = u.id
            WHERE $where
        ";

        if (!empty($filters['min_rating'])) {
            $sql      .= ' HAVING avg_rating >= ?';
            $bindings[] = (float)$filters['min_rating'];
        }

        $sql .= " ORDER BY avg_rating DESC, u.name ASC LIMIT ? OFFSET ?";
        $bindings[] = $perPage;
        $bindings[] = $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    // ----------------------------------------------------------------
    // Write operations
    // ----------------------------------------------------------------

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (name, email, password, role)
             VALUES (:name, :email, :password, :role)'
        );
        $stmt->execute([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => $data['role'] ?? 'user',
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateProfile(int $id, array $data): bool
    {
        $fields   = [];
        $bindings = [];

        foreach (['name', 'bio', 'jurusan', 'angkatan', 'avatar'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[]         = "$field = :$field";
                $bindings[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $bindings['id'] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        return $this->db->prepare($sql)->execute($bindings);
    }

    public function updatePassword(int $id, string $hashedPassword): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET password = ? WHERE id = ?');
        return $stmt->execute([$hashedPassword, $id]);
    }

    public function setActiveStatus(int $id, bool $active): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET is_active = ? WHERE id = ?');
        return $stmt->execute([(int)$active, $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        return $stmt->execute([$id]);
    }

    // ----------------------------------------------------------------
    // Stats
    // ----------------------------------------------------------------

    public function getStats(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                (SELECT COUNT(*) FROM skills WHERE user_id = :uid AND is_active = 1)                     AS total_skills,
                (SELECT COUNT(*) FROM collaborations WHERE (requester_id = :uid OR receiver_id = :uid))  AS total_collabs,
                (SELECT COUNT(*) FROM collaborations
                    WHERE (requester_id = :uid OR receiver_id = :uid) AND status = 'pending')             AS pending_requests,
                (SELECT COUNT(*) FROM collaborations
                    WHERE (requester_id = :uid OR receiver_id = :uid) AND status = 'completed')           AS completed_collabs,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = :uid)                  AS avg_rating
        ");
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetch();
    }
}
