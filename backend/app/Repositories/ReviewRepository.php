<?php
// app/Repositories/ReviewRepository.php

namespace App\Repositories;

use App\Helpers\Database;
use PDO;

class ReviewRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, u.name AS reviewer_name, u.avatar AS reviewer_avatar
             FROM reviews r
             JOIN users u ON u.id = r.reviewer_id
             WHERE r.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByCollaboration(int $collabId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, u.name AS reviewer_name FROM reviews r
             JOIN users u ON u.id = r.reviewer_id
             WHERE r.collaboration_id = ? LIMIT 1'
        );
        $stmt->execute([$collabId]);
        return $stmt->fetch() ?: null;
    }

    public function findByReviewee(int $userId, int $page = 1, int $perPage = 10): array
    {
        $offset = ($page - 1) * $perPage;
        $stmt   = $this->db->prepare(
            'SELECT r.*, u.name AS reviewer_name, u.avatar AS reviewer_avatar
             FROM reviews r
             JOIN users u ON u.id = r.reviewer_id
             WHERE r.reviewee_id = ?
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?'
        );
        $stmt->execute([$userId, $perPage, $offset]);
        return $stmt->fetchAll();
    }

    public function getReputation(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COALESCE(AVG(rating), 0) AS avg_rating,
                COUNT(*)                  AS review_count,
                SUM(rating = 5)           AS five_star,
                SUM(rating = 4)           AS four_star,
                SUM(rating = 3)           AS three_star,
                SUM(rating = 2)           AS two_star,
                SUM(rating = 1)           AS one_star
             FROM reviews
             WHERE reviewee_id = ?'
        );
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    /** Top-rated users for leaderboard / explore page */
    public function topRated(int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id, u.name, u.avatar, u.jurusan,
                    ROUND(AVG(r.rating), 2) AS avg_rating,
                    COUNT(r.id)             AS review_count
             FROM reviews r
             JOIN users u ON u.id = r.reviewee_id
             WHERE u.is_active = 1
             GROUP BY u.id, u.name, u.avatar, u.jurusan
             HAVING review_count >= 1
             ORDER BY avg_rating DESC, review_count DESC
             LIMIT ?'
        );
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO reviews (collaboration_id, reviewer_id, reviewee_id, rating, comment)
             VALUES (:collaboration_id, :reviewer_id, :reviewee_id, :rating, :comment)'
        );
        $stmt->execute([
            'collaboration_id' => $data['collaboration_id'],
            'reviewer_id'      => $data['reviewer_id'],
            'reviewee_id'      => $data['reviewee_id'],
            'rating'           => $data['rating'],
            'comment'          => $data['comment'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }
}
