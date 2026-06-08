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

    /**
     * Find users who OFFER skills that match what the current user WANTS,
     * and who WANT skills that the current user OFFERS.
     */
    public function findMatches(int $userId): array
    {
        // Skills current user offers
        $offeredStmt = $this->db->prepare(
            "SELECT name FROM skills WHERE user_id = ? AND type = 'offered' AND is_active = 1"
        );
        $offeredStmt->execute([$userId]);
        $offeredNames = $offeredStmt->fetchAll(PDO::FETCH_COLUMN);

        // Skills current user wants
        $wantedStmt = $this->db->prepare(
            "SELECT name FROM skills WHERE user_id = ? AND type = 'wanted' AND is_active = 1"
        );
        $wantedStmt->execute([$userId]);
        $wantedNames = $wantedStmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($wantedNames)) return [];

        $placeholders = implode(',', array_fill(0, count($wantedNames), '?'));

        $sql = "
            SELECT DISTINCT
                u.id, u.name, u.avatar, u.bio, u.jurusan,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS matched_skills
            FROM skills s
            JOIN users  u ON u.id = s.user_id
            LEFT JOIN reviews r ON r.reviewee_id = u.id
            WHERE s.type       = 'offered'
              AND s.is_active  = 1
              AND u.is_active  = 1
              AND u.id        <> ?
              AND s.name       IN ($placeholders)
            GROUP BY u.id, u.name, u.avatar, u.bio, u.jurusan
            ORDER BY avg_rating DESC
        ";

        $bindings = array_merge([$userId], $wantedNames);
        $stmt     = $this->db->prepare($sql);
        $stmt->execute($bindings);
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
            'level'       => $data['level'],
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
            'level'       => $data['level'],
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
