<?php
// app/Services/ReviewService.php

namespace App\Services;

use App\Repositories\CollaborationRepository;
use App\Repositories\ReviewRepository;

class ReviewService
{
    private ReviewRepository        $reviews;
    private CollaborationRepository $collabs;

    public function __construct()
    {
        $this->reviews = new ReviewRepository();
        $this->collabs = new CollaborationRepository();
    }

    /**
     * Submit a review after a completed collaboration.
     * Rules:
     *  - Collaboration must be 'completed'
     *  - Only a participant (requester or receiver) can review
     *  - Each collaboration can only have one review (UNIQUE on collaboration_id)
     */
    public function submit(int $reviewerId, array $data): array
    {
        $collabId = (int)$data['collaboration_id'];
        $collab   = $this->collabs->findById($collabId);

        if (!$collab) {
            return ['success' => false, 'message' => 'Collaboration not found.'];
        }

        if ($collab['status'] !== 'completed') {
            return ['success' => false, 'message' => 'You can only review completed collaborations.'];
        }

        $requesterId = (int)$collab['requester_id'];
        $receiverId  = (int)$collab['receiver_id'];

        // Must be a participant
        if ($reviewerId !== $requesterId && $reviewerId !== $receiverId) {
            return ['success' => false, 'message' => 'Forbidden.', 'code' => 403];
        }

        // Cannot review yourself (should never happen, but defensive)
        // Determine reviewee (the other person)
        $revieweeId = ($reviewerId === $requesterId) ? $receiverId : $requesterId;

        // Check if review already submitted for this collaboration
        if ($this->reviews->findByCollaboration($collabId)) {
            return ['success' => false, 'message' => 'This collaboration has already been reviewed.'];
        }

        $id     = $this->reviews->create([
            'collaboration_id' => $collabId,
            'reviewer_id'      => $reviewerId,
            'reviewee_id'      => $revieweeId,
            'rating'           => (int)$data['rating'],
            'comment'          => $data['comment'] ?? null,
        ]);
        $review = $this->reviews->findById($id);

        return ['success' => true, 'message' => 'Review submitted.', 'data' => $review];
    }

    public function getReputation(int $userId): array
    {
        return $this->reviews->getReputation($userId);
    }

    public function getReviewsForUser(int $userId, int $page = 1, int $perPage = 10): array
    {
        return $this->reviews->findByReviewee($userId, $page, $perPage);
    }

    public function getTopRated(int $limit = 10): array
    {
        return $this->reviews->topRated($limit);
    }
}
