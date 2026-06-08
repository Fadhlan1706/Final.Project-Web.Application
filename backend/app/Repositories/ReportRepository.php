<?php
// app/Repositories/ReportRepository.php

namespace App\Repositories;

use App\Helpers\Database;
use PDO;

class ReportRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $stmt = $this->db->prepare('
            SELECT r.*, 
                   u1.NAME as reporter_name, u1.email as reporter_email,
                   u2.NAME as reported_name, u2.email as reported_email
            FROM reports r
            JOIN users u1 ON r.reporterId = u1.id
            JOIN users u2 ON r.reportedUserId = u2.id
            ORDER BY r.create_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM reports WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function updateStatus(int $id, string $status, int $adminId): bool
    {
        $stmt = $this->db->prepare('UPDATE reports SET STATUS = ?, handledByAdminId = ? WHERE id = ?');
        return $stmt->execute([$status, $adminId, $id]);
    }

    public function countActive(): int
    {
        return (int)$this->db->query("SELECT COUNT(*) FROM reports WHERE STATUS = 'pending'")->fetchColumn();
    }
}
