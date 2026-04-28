<?php
    require_once 'config/database.php';

    header('Content-Type: application/json');
    echo json_encode([
        "staus" => "success",
        "message" => "Response dari Service Complaints",
        "databse" => $conn ? "Terhubung" : "Tidak Terhubung"
    ]);
?>