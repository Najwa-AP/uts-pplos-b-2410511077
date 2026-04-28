<?php
    require_once 'config/database.php';

    header('Content-Type: application/json');
    echo json_encode([
        "message" => "Response dari Service Complaints",
        "database" => $conn ? "Terhubung" : "Tidak Terhubung"
    ]);
?>