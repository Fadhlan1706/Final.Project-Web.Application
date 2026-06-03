<?php
// app/Repositories/CollaborationRepository.php

namespace App\Repositories;

use App\Helpers\Database;
use PDO;

class CollaborationRepository
{
    private PDO $db;

    private const SELECT_FULL = "
        SELECT
            c.*,
            req.name   AS requester_name,  req.avatar  AS requester_avatar,
            rec.name   AS receiver_name,   rec.avatar  AS receiver_avatar,
            s.name     AS skill_name,      s.level     AS skill_level,
            cat.name   AS category_name
        FROM collaborations c
        JOIN users      req ON req.id = c.requester_id
        JOIN users      rec ON rec.id = c.receiver_id
        JOIN skills     s   ON s.id   = c.skill_id
        JOIN categories cat ON cat.id = s.category_id
    ";

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ----------------------------------------------------------------
    // Finders
    // ----------------------------------------------------------------

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(self::SELECT_FULL . ' WHERE c.id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** All collaborations involving a user (as requester OR receiver) */
    public function findByUser(int $userId, ?string $status = null, string $role = 'any'): array
    {
        $conditions = [];
        $bindings   = [];

        match ($role) {
            'requester' => ($conditions[] = 'c.requester_id = ?' and $bindings[] = $userId),
            'receiver'  => ($conditions[] = 'c.receiver_id = ?'  and $bindings[] = $userId),
            default     => ($conditions[] = '(c.requester_id = ? OR c.receiver_id = ?)'
                            and $bindings[] = $userId and $bindings[] = $userId),
        };

        if ($status) {
            $conditions[] = 'c.status = ?';
            $bindings[]   = $status;
        }

        $where = implode(' AND ', $conditions);
        $stmt  = $this->db->prepare(
            self::SELECT_FULL . " WHERE $where ORDER BY c.updated_at DESC"
        );
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    /** Check if a pending request already exists between these two users for the same skill */
    public function pendingExists(int $requesterId, int $receiverId, int $skillId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM collaborations
             WHERE requester_id = ? AND receiver_id = ? AND skill_id = ? AND status = 'pending'"
        );
        $stmt->execute([$requesterId, $receiverId, $skillId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function findAll(?string $status = null, int $page = 1, int $perPage = 20): array
    {
        $where    = $status ? 'WHERE c.status = ?' : '';
        $bindings = $status ? [$status] : [];
        $offset   = ($page - 1) * $perPage;

        $stmt = $this->db->prepare(
            self::SELECT_FULL . " $where ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
        );
        $bindings[] = $perPage;
        $bindings[] = $offset;
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    // ----------------------------------------------------------------
    // Write
    // ----------------------------------------------------------------

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO collaborations (requester_id, receiver_id, skill_id, message, status)
             VALUES (:requester_id, :receiver_id, :skill_id, :message, :status)'
        );
        $stmt->execute([
            'requester_id' => $data['requester_id'],
            'receiver_id'  => $data['receiver_id'],
            'skill_id'     => $data['skill_id'],
            'message'      => $data['message'] ?? null,
            'status'       => 'pending',
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE collaborations SET status = ? WHERE id = ?'
        );
        return $stmt->execute([$status, $id]);
    }

    // ----------------------------------------------------------------
    // Admin stats
    // ----------------------------------------------------------------

    public function countByStatus(): array
    {
        $stmt = $this->db->query(
            "SELECT status, COUNT(*) AS count FROM collaborations GROUP BY status"
        );
        $rows = $stmt->fetchAll();
        // normalize to keyed array
        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int)$row['count'];
        }
        return $result;
    }
}
