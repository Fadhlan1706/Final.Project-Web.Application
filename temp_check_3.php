<?php
require 'backend/app/Helpers/Database.php';
require 'backend/app/Repositories/UserRepository.php';
require 'backend/app/Repositories/SkillRepository.php';

$db = \App\Helpers\Database::getInstance();

$skills = new \App\Repositories\SkillRepository();
try {
    $pop = $skills->popularSkills(5);
    echo "popularSkills OK.\n";
} catch (Exception $e) {
    echo "Error popularSkills: " . $e->getMessage() . "\n";
}

try {
    $want = $skills->mostWanted(5);
    echo "mostWanted OK.\n";
} catch (Exception $e) {
    echo "Error mostWanted: " . $e->getMessage() . "\n";
}

$users = new \App\Repositories\UserRepository();
try {
    $top = $users->searchTalents(['min_rating' => 0], 1, 5);
    echo "searchTalents OK.\n";
} catch (Exception $e) {
    echo "Error searchTalents: " . $e->getMessage() . "\n";
}
