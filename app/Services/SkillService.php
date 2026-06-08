<?php
// app/Services/SkillService.php

namespace App\Services;

use App\Repositories\CategoryRepository;
use App\Repositories\SkillRepository;

class SkillService
{
    private SkillRepository    $skills;
    private CategoryRepository $categories;

    public function __construct()
    {
        $this->skills     = new SkillRepository();
        $this->categories = new CategoryRepository();
    }

    public function listForUser(int $userId, ?string $type = null): array
    {
        return $this->skills->findByUser($userId, $type);
    }

    public function search(array $filters, int $page, int $perPage): array
    {
        $items = $this->skills->findAll($filters, $page, $perPage);
        $total = $this->skills->countAll($filters);

        return [
            'items'       => $items,
            'total'       => $total,
            'page'        => $page,
            'per_page'    => $perPage,
            'total_pages' => (int)ceil($total / $perPage),
        ];
    }

    public function create(int $userId, array $data): array
    {
        // Validate category exists
        if (!$this->categories->findById((int)$data['category_id'])) {
            return ['success' => false, 'message' => 'Category not found.'];
        }

        $id    = $this->skills->create(array_merge($data, ['user_id' => $userId]));
        $skill = $this->skills->findById($id);

        return ['success' => true, 'message' => 'Skill added.', 'data' => $skill];
    }

    public function update(int $skillId, int $userId, array $data): array
    {
        $skill = $this->skills->findById($skillId);

        if (!$skill) {
            return ['success' => false, 'message' => 'Skill not found.'];
        }

        // Ownership check
        if ((int)$skill['userId'] !== $userId) {
            return ['success' => false, 'message' => 'Forbidden.', 'code' => 403];
        }

        if (!$this->categories->findById((int)$data['category_id'])) {
            return ['success' => false, 'message' => 'Category not found.'];
        }

        $this->skills->update($skillId, $data);
        return ['success' => true, 'message' => 'Skill updated.', 'data' => $this->skills->findById($skillId)];
    }

    public function delete(int $skillId, int $userId, bool $isAdmin = false): array
    {
        $skill = $this->skills->findById($skillId);

        if (!$skill) {
            return ['success' => false, 'message' => 'Skill not found.'];
        }

        if (!$isAdmin && (int)$skill['userId'] !== $userId) {
            return ['success' => false, 'message' => 'Forbidden.', 'code' => 403];
        }

        $this->skills->softDelete($skillId);
        return ['success' => true, 'message' => 'Skill removed.'];
    }

    public function getMatches(int $userId): array
    {
        return $this->skills->findMatches($userId);
    }

    public function getStats(): array
    {
        return [
            'popular' => $this->skills->popularSkills(),
            'wanted'  => $this->skills->mostWanted(),
        ];
    }
}
