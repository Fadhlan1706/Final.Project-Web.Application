<?php
$ch = curl_init('http://localhost:8000/api/auth/register');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'OPTIONS');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://127.0.0.1:5500',
    'Access-Control-Request-Method: POST',
    'Access-Control-Request-Headers: content-type, accept'
]);

$response = curl_exec($ch);
if(curl_errno($ch)){
    echo 'Curl error: ' . curl_error($ch);
}
curl_close($ch);
echo "RESPONSE:\n";
echo $response;
