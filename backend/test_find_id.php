<?php
require 'app/Helpers/Database.php';
require 'app/Repositories/UserRepository.php';
$r = new \App\Repositories\UserRepository();
var_dump($r->findById(1));
