<?php
// app/Services/CollaborationService.php

namespace App\Services;

use App\Repositories\CollaborationRepository;
use App\Repositories\SkillRepository;

class CollaborationService
{
    private CollaborationRepository $collabs;
    private SkillRepository         $skills;

    /**
     * Valid transitions: current_status => [allowed_next_statuses]
     * Keyed by who can make the transition: 'receiver' or 'requester' or 'both'
     */
    private const TRANSITIONS = [
        'pending'     => ['accepted', 'rejected'],  // receiver decides
        'accepted'    => ['completed'],             // either party
        'completed'   => [],
        'rejected'    => [],
    ];

    public function __construct()
    {
        $this->collabs = new CollaborationRepository();
        $this->skills  = new SkillRepository();
    }

    // ----------------------------------------------------------------
    // Send request
    // ----------------------------------------------------------------

    public function sendRequest(int $requesterId, array $data): array
    {
        $receiverId = (int)$data['receiver_id'];

        // Cannot request yourself
        if ($requesterId === $receiverId) {
            return ['success' => false, 'message' => 'You cannot send a request to yourself.'];
        }

        // No duplicate pending requests
        if ($this->collabs->pendingExists($requesterId, $receiverId)) {
            return ['success' => false, 'message' => 'You already have a pending request for this user.'];
        }

        $id     = $this->collabs->create([
            'requester_id' => $requesterId,
            'receiver_id'  => $receiverId,
            'message'      => $data['message'] ?? null,
        ]);
        $collab = $this->collabs->findById($id);

        return ['success' => true, 'message' => 'Collaboration request sent.', 'data' => $collab];
    }

    // ----------------------------------------------------------------
    // Transition status (accept, reject, start, complete)
    // ----------------------------------------------------------------

    public function transition(int $collabId, int $userId, string $newStatus): array
    {
        $collab = $this->collabs->findById($collabId);

        if (!$collab) {
            return ['success' => false, 'message' => 'Collaboration not found.'];
        }

        $currentStatus = $collab['status'];
        $requesterId   = (int)$collab['requester_id'];
        $receiverId    = (int)$collab['receiver_id'];

        // Must be a participant
        if ($userId !== $requesterId && $userId !== $receiverId) {
            return ['success' => false, 'message' => 'Forbidden.', 'code' => 403];
        }

        // Check transition is allowed
        $allowed = self::TRANSITIONS[$currentStatus] ?? [];
        if (!in_array($newStatus, $allowed, true)) {
            return [
                'success' => false,
                'message' => "Cannot transition from '$currentStatus' to '$newStatus'.",
            ];
        }

        // Accept / Reject — only receiver can decide
        if (in_array($newStatus, ['accepted', 'rejected'], true) && $userId !== $receiverId) {
            return ['success' => false, 'message' => 'Only the receiver can accept or reject.', 'code' => 403];
        }

        $this->collabs->updateStatus($collabId, $newStatus);
        $updated = $this->collabs->findById($collabId);

        return ['success' => true, 'message' => "Status updated to '$newStatus'.", 'data' => $updated];
    }

    // ----------------------------------------------------------------
    // List
    // ----------------------------------------------------------------

    public function listForUser(int $userId, ?string $status = null, string $role = 'any'): array
    {
        return $this->collabs->findByUser($userId, $status, $role);
    }

    public function getById(int $collabId, int $userId): array
    {
        $collab = $this->collabs->findById($collabId);

        if (!$collab) {
            return ['success' => false, 'message' => 'Not found.'];
        }

        // Must be participant or admin (admin check done in controller)
        if ((int)$collab['requester_id'] !== $userId && (int)$collab['receiver_id'] !== $userId) {
            return ['success' => false, 'message' => 'Forbidden.', 'code' => 403];
        }

        return ['success' => true, 'data' => $collab];
    }
}
