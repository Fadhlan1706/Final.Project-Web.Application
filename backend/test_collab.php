<?php
require 'app/Helpers/Database.php';
require 'app/Repositories/CollaborationRepository.php';
$r = new \App\Repositories\CollaborationRepository();
print_r($r->findByUser(1));
