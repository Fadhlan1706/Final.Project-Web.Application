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
            c.id, c.senderId AS requester_id, c.receiverId AS receiver_id, c.message, c.STATUS AS status, c.create_at AS created_at, c.create_at AS updated_at,
            req.NAME   AS requester_name,  req.profilePicture  AS requester_avatar,
            rec.NAME   AS receiver_name,   rec.profilePicture  AS receiver_avatar,
            NULL       AS skill_name,      NULL        AS skill_level,
            NULL       AS category_name
        FROM collaborationRequests c
        JOIN users      req ON req.id = c.senderId
        JOIN users      rec ON rec.id = c.receiverId
    ";

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(self::SELECT_FULL . ' WHERE c.id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByUser(int $userId, ?string $status = null, string $role = 'any'): array
    {
        $conditions = [];
        $bindings   = [];

        match ($role) {
            'requester' => ($conditions[] = 'c.senderId = ?' and $bindings[] = $userId),
            'receiver'  => ($conditions[] = 'c.receiverId = ?'  and $bindings[] = $userId),
            default     => ($conditions[] = '(c.senderId = ? OR c.receiverId = ?)'
                            and $bindings[] = $userId and $bindings[] = $userId),
        };

        if ($status) {
            $conditions[] = 'c.STATUS = ?';
            $bindings[]   = $status;
        }

        $where = implode(' AND ', $conditions);
        $stmt  = $this->db->prepare(
            self::SELECT_FULL . " WHERE $where ORDER BY c.create_at DESC"
        );
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    public function pendingExists(int $requesterId, int $receiverId, int $skillId = 0): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM collaborationRequests
             WHERE senderId = ? AND receiverId = ? AND STATUS = 'pending'"
        );
        $stmt->execute([$requesterId, $receiverId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function findAll(?string $status = null, int $page = 1, int $perPage = 20): array
    {
        $where    = $status ? 'WHERE c.STATUS = ?' : '';
        $bindings = $status ? [$status] : [];
        $offset   = ($page - 1) * $perPage;

        $stmt = $this->db->prepare(
            self::SELECT_FULL . " $where ORDER BY c.create_at DESC LIMIT ? OFFSET ?"
        );
        $bindings[] = $perPage;
        $bindings[] = $offset;
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO collaborationRequests (senderId, receiverId, message, STATUS)
             VALUES (:requester_id, :receiver_id, :message, 'pending')"
        );
        $stmt->execute([
            'requester_id' => $data['requester_id'],
            'receiver_id'  => $data['receiver_id'],
            'message'      => $data['message'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE collaborationRequests SET STATUS = ? WHERE id = ?'
        );
        return $stmt->execute([$status, $id]);
    }

    public function countByStatus(): array
    {
        $stmt = $this->db->query(
            "SELECT STATUS AS status, COUNT(*) AS count FROM collaborationRequests GROUP BY STATUS"
        );
        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int)$row['count'];
        }
        return $result;
    }
}

