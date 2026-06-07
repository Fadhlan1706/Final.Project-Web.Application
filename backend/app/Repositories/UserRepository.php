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
    
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, NAME AS name, email, major, bio, profilePicture, reputationScore, STATUS AS status, is_verified, create_at AS created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, NAME AS name, email, PASSWORD AS password, major, bio, profilePicture, reputationScore, STATUS AS status, is_verified, verification_code, create_at AS created_at FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $stmt   = $this->db->prepare(
            'SELECT id, NAME AS name, email, major, bio, profilePicture, reputationScore, STATUS AS status, is_verified, create_at AS created_at
             FROM users ORDER BY create_at DESC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function countAll(): int
    {
        return (int)$this->db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }

    public function searchTalents(array $filters = [], int $page = 1, int $perPage = 12): array
    {
        $conditions = ["u.STATUS = 'active'"];
        $bindings   = [];

        if (!empty($filters['search'])) {
            $conditions[] = '(s.skillName LIKE ? OR u.NAME LIKE ?)';
            $bindings[]   = '%' . $filters['search'] . '%';
            $bindings[]   = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 's.categoryId = ?';
            $bindings[]   = (int)$filters['category_id'];
        }
        if (!empty($filters['level'])) {
            $conditions[] = 's.skillLevel = ?';
            $bindings[]   = $filters['level'];
        }

        $where  = implode(' AND ', $conditions);
        $offset = ($page - 1) * $perPage;

        $sql = "
            SELECT DISTINCT
                u.id, u.NAME AS name, u.profilePicture, u.bio, u.major, u.reputationScore,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(DISTINCT r.id)       AS review_count
            FROM users u
            LEFT JOIN skills  s ON s.userId = u.id
            LEFT JOIN reviews r ON r.reviewedUserId = u.id
            WHERE $where
            GROUP BY u.id
        ";

        if (!empty($filters['min_rating'])) {
            $sql      .= ' HAVING avg_rating >= ?';
            $bindings[] = (float)$filters['min_rating'];
        }

        $sql .= " ORDER BY avg_rating DESC, u.NAME ASC LIMIT ? OFFSET ?";
        $bindings[] = $perPage;
        $bindings[] = $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }


    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (name, email, password, is_verified, verification_code)
             VALUES (:name, :email, :password, :is_verified, :verification_code)'
        );
        $stmt->execute([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => $data['password'],
            'is_verified'       => $data['is_verified'] ?? 0,
            'verification_code' => $data['verification_code'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function verifyEmail(int $id): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function updateProfile(int $id, array $data): bool
    {
        $fields   = [];
        $bindings = [];

        $schemaMapping = [
            'name'           => 'name',
            'bio'            => 'bio',
            'major'          => 'major',
            'profilePicture' => 'profilePicture'
        ];

        foreach ($schemaMapping as $arrayKey => $dbColumn) {
            if (array_key_exists($arrayKey, $data)) {
                $fields[]         = "$dbColumn = :$arrayKey";
                $bindings[$arrayKey] = $data[$arrayKey];
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

    public function setStatus(int $id, string $status): bool
    {
        // Allowed values matching schema enum constraints
        if (!in_array($status, ['active', 'suspended'])) {
            return false;
        }
        $stmt = $this->db->prepare('UPDATE users SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function getStats(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                (SELECT COUNT(*) FROM skills WHERE userId = :uid) AS total_skills,
                (SELECT COUNT(*) FROM collaborationRequests WHERE senderId = :uid OR receiverId = :uid) AS total_collabs,
                (SELECT COUNT(*) FROM collaborationRequests WHERE (senderId = :uid OR receiverId = :uid) AND STATUS = 'pending') AS pending_requests,
                (SELECT COUNT(*) FROM collaborationRequests WHERE (senderId = :uid OR receiverId = :uid) AND STATUS = 'completed') AS completed_collabs,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewedUserId = :uid) AS avg_rating
        ");
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetch();
    }
}