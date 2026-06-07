<?php
require 'app/Helpers/Session.php';
\App\Helpers\Session::start();
\App\Helpers\Session::set('user_id', 1);

$_SERVER['REQUEST_URI'] = '/api/collaborations';
$_SERVER['REQUEST_METHOD'] = 'GET';
require 'public/index.php';
