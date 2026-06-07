<?php
require 'public/index.php';
use App\Repositories\UserRepository;
use App\Repositories\SkillRepository;
use App\Repositories\CollaborationRepository;
use App\Repositories\ReviewRepository;

try {
    $ur = new UserRepository();
    print_r($ur->findAll(1, 1));

    $sr = new SkillRepository();
    print_r($sr->findAll());

    $cr = new CollaborationRepository();
    print_r($cr->findAll());

    $rr = new ReviewRepository();
    print_r($rr->topRated());

    echo "SUCCESS\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
