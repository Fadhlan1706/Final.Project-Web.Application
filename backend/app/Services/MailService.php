<?php
// app/Services/MailService.php

namespace App\Services;

require_once __DIR__ . '/../Vendor/PHPMailer/PHPMailer/Exception.php';
require_once __DIR__ . '/../Vendor/PHPMailer/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../Vendor/PHPMailer/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    public static function sendVerificationCode(string $toEmail, string $code): bool
    {
        $username = $_ENV['SMTP_USER'] ?? getenv('SMTP_USER');
        $password = $_ENV['SMTP_PASS'] ?? getenv('SMTP_PASS');

        if (!$username || !$password) {
            return false;
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $username;
            $mail->Password   = $password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->setFrom($username, 'SkillSwap');
            $mail->addAddress($toEmail);

            $mail->isHTML(true);
            $mail->Subject = 'Your Verification Code - SkillSwap';
            $mail->Body    = "
                <h2>Welcome to SkillSwap!</h2>
                <p>Your verification code is: <strong>$code</strong></p>
                <p>Please enter this code in the application to verify your email.</p>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}