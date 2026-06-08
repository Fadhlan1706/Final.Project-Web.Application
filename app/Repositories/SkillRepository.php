<?php
// app/Repositories/SkillRepository.php

namespace App\Repositories;

use App\Helpers\Database;
use PDO;

class SkillRepository
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
            'SELECT s.*, c.categoryName AS category_name, u.NAME AS user_name, s.skillName AS name, s.skillLevel AS level
             FROM skills s
             JOIN categories c ON c.id = s.categoryId
             JOIN users      u ON u.id = s.userId
             WHERE s.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByUser(int $userId, ?string $type = null): array
    {
        $sql      = 'SELECT s.*, c.categoryName AS category_name, s.skillName AS name, s.skillLevel AS level FROM skills s
                     JOIN categories c ON c.id = s.categoryId
                     WHERE s.userId = ?';
        $bindings = [$userId];

        // Type is not in schema.sql, we ignore it or handle it if we want

        $sql .= ' ORDER BY s.create_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $conditions = ['1 = 1'];
        $bindings   = [];

        if (!empty($filters['search'])) {
            $conditions[] = 's.skillName LIKE ?';
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

        $sql = "SELECT s.*, c.categoryName AS category_name, u.NAME AS user_name, s.skillName AS name, s.skillLevel AS level
                FROM skills s
                JOIN categories c ON c.id = s.categoryId
                JOIN users      u ON u.id = s.userId
                WHERE $where
                ORDER BY s.create_at DESC
                LIMIT ? OFFSET ?";

        $bindings[] = $perPage;
        $bindings[] = $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    public function countAll(array $filters = []): int
    {
        $conditions = ['1 = 1'];
        $bindings   = [];

        if (!empty($filters['search'])) {
            $conditions[] = 's.skillName LIKE ?';
            $bindings[]   = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 's.categoryId = ?';
            $bindings[]   = (int)$filters['category_id'];
        }

        $where = implode(' AND ', $conditions);
        $stmt  = $this->db->prepare(
            "SELECT COUNT(*) FROM skills s WHERE $where"
        );
        $stmt->execute($bindings);
        return (int)$stmt->fetchColumn();
    }

    // ----------------------------------------------------------------
    // Skill Matching
    // ----------------------------------------------------------------

    public function findMatches(int $userId): array
    {
        // Because "wanted" type doesn't exist, this function should just find users with high ratings
        // that offer skills this user doesn't have, or just popular ones.
        $sql = "
            SELECT DISTINCT
                u.id, u.name, u.avatar, u.bio, u.jurusan,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                GROUP_CONCAT(DISTINCT s.skillName ORDER BY s.skillName SEPARATOR ', ') AS matched_skills
            FROM skills s
            JOIN users  u ON u.id = s.userId
            LEFT JOIN reviews r ON r.target_user_id = u.id
            WHERE u.id <> ?
            GROUP BY u.id, u.name, u.avatar, u.bio, u.jurusan
            ORDER BY avg_rating DESC
            LIMIT 10
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    // ----------------------------------------------------------------
    // Popularity stats
    // ----------------------------------------------------------------

    public function popularSkills(int $limit = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT s.skillName AS name, c.categoryName AS category, COUNT(*) AS count
            FROM skills s
            JOIN categories c ON c.id = s.categoryId
            GROUP BY s.skillName, c.categoryName
            ORDER BY count DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function mostWanted(int $limit = 10): array
    {
        return [];
    }

    // ----------------------------------------------------------------
    // Write
    // ----------------------------------------------------------------

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO skills (userId, categoryId, skillName, description, skillLevel)
             VALUES (:user_id, :category_id, :name, :description, :level)'
        );
        $stmt->execute([
            'user_id'     => $data['user_id'],
            'category_id' => $data['category_id'],
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'level'       => ucfirst(strtolower($data['level'])),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE skills
             SET categoryId = :category_id, skillName = :name, description = :description,
                 skillLevel = :level
             WHERE id = :id'
        );
        return $stmt->execute([
            'category_id' => $data['category_id'],
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'level'       => ucfirst(strtolower($data['level'])),
            'id'          => $id,
        ]);
    }

    public function softDelete(int $id): bool
    {
        return $this->hardDelete($id);
    }

    public function hardDelete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM skills WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
