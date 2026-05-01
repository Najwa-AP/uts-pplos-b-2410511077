<?php
    require_once 'config/database.php';
    require_once 'app/models/complaintModel.php';
    require_once 'app/controllers/complaintController.php';

    header("Content-Type: application/json; charset=UTF-8");

    // inisialisasi database
    $database = new database();
    $db = $database->getConnection();

    // inisialisasi kontroller
    $controller = new complaintController($db);

    // ambil URL & method
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];
    
    // --- ROUTE SERVICE COMPLAINT ---
    if ($uri == '/index.php' || $uri == '/') {
        if ($method == 'GET') {
            $controller->list();
        } elseif ($method == 'POST') {
            $controller->create();
        } else {
            http_response_code(405);
            echo json_encode([
                "status" => "error", 
                "message" => "Method yang anda gunakan tidak dibolehkan, silahkan pakai method lain"]);
        }
    } elseif ($uri == '/rate' && $method == 'POST') {
        $controller->rate();
    } else {
        http_response_code(404);
        echo json_encode([
            "status" => "error", 
            "message" => "Endpoint tidak ditemukan, silakan ketik endpoint yang benar"]);
    }
?>